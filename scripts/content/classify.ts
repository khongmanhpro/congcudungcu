/**
 * Phân loại lại toàn bộ sản phẩm theo taxonomy mới + gán thương hiệu & mã model.
 *
 *   pnpm exec tsx scripts/content/classify.ts --dry-run   # chỉ báo cáo, không ghi DB
 *   pnpm exec tsx scripts/content/classify.ts             # ghi DB
 *
 * Idempotent: chạy lại nhiều lần cho cùng kết quả. Báo cáo CSV: tmp/content-reports/classify.csv
 * (cột "via": rule = khớp luật, fallback = theo danh mục cũ → người duyệt nên xem các dòng này).
 */
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { detectBrand, extractModel, looksLikeStandard } from "./brands";
import { FALLBACK, OLD_CATEGORY_REDIRECT, classifyName, flattenTaxonomy, normalizeName } from "./taxonomy";

const DRY_RUN = process.argv.includes("--dry-run");
const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL!) });

const csvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

async function main() {
  const nodes = flattenTaxonomy();
  const nodeBySlug = new Map(nodes.map((n) => [n.slug, n]));
  const pathOf = (slug: string) => {
    const node = nodeBySlug.get(slug)!;
    return node.parent ? `/${node.parent}/${node.slug}` : `/${node.slug}`;
  };

  const products = await prisma.product.findMany({
    select: { id: true, name: true, slug: true, model: true, brandId: true, category: { select: { slug: true } } },
  });

  // 1) Tính kết quả cho từng sản phẩm
  const plan = products.map((p) => {
    const normalized = normalizeName(p.name);
    const ruleSlug = classifyName(p.name);
    const oldSlug = p.category?.slug ?? null;
    const fallbackSlug = oldSlug && (FALLBACK[oldSlug] ?? (nodeBySlug.get(oldSlug)?.leaf ? oldSlug : null));
    const target = ruleSlug ?? fallbackSlug ?? "dung-cu-cam-tay-khac";
    return {
      ...p,
      oldSlug,
      target,
      via: ruleSlug ? "rule" : fallbackSlug ? "fallback" : "default",
      brand: detectBrand(normalized),
      // model cũ là số tiêu chuẩn (EN471, M18…) → tách lại từ tên
      model: p.model && !looksLikeStandard(p.model) ? p.model : extractModel(p.name),
    };
  });

  // 2) Báo cáo
  const counts = new Map<string, number>();
  for (const row of plan) counts.set(row.target, (counts.get(row.target) ?? 0) + 1);
  mkdirSync("tmp/content-reports", { recursive: true });
  writeFileSync(
    "tmp/content-reports/classify.csv",
    ["slug,name,old_category,new_category,via,brand,model", ...plan.map((r) => [r.slug, r.name, r.oldSlug, r.target, r.via, r.brand?.name, r.model].map(csvCell).join(","))].join("\n"),
  );
  console.log(`Sản phẩm: ${plan.length} | khớp luật: ${plan.filter((r) => r.via === "rule").length} | theo danh mục cũ: ${plan.filter((r) => r.via !== "rule").length}`);
  console.log(`Có thương hiệu: ${plan.filter((r) => r.brand).length} | có mã model: ${plan.filter((r) => r.model).length}`);
  console.log("\nPhân bố danh mục mới (⚠ = <6 hoặc >200 sản phẩm):");
  for (const node of nodes.filter((n) => n.leaf)) {
    const n = counts.get(node.slug) ?? 0;
    console.log(`  ${n < 6 || n > 200 ? "⚠" : " "} ${String(n).padStart(4)}  ${pathOf(node.slug)}  ${node.name}`);
  }
  console.log("\nBáo cáo chi tiết: tmp/content-reports/classify.csv");
  if (DRY_RUN) return;

  // 3) Danh mục: tạo/cập nhật theo taxonomy (cha trước con)
  const idBySlug = new Map<string, string>();
  for (const node of nodes) {
    const parentId = node.parent ? idBySlug.get(node.parent)! : null;
    const row = await prisma.category.upsert({
      where: { slug: node.slug },
      update: { name: node.name, parentId, position: node.position, type: "PRODUCT" },
      create: { name: node.name, slug: node.slug, parentId, position: node.position, type: "PRODUCT" },
    });
    idBySlug.set(node.slug, row.id);
  }

  // 4) Thương hiệu
  const brandIdBySlug = new Map<string, string>();
  for (const brand of new Map(plan.flatMap((r) => (r.brand ? [[r.brand.slug, r.brand] as const] : []))).values()) {
    const row = await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: { name: brand.name, country: brand.country ?? undefined },
      create: { name: brand.name, slug: brand.slug, country: brand.country ?? null },
    });
    brandIdBySlug.set(brand.slug, row.id);
  }

  // 5) Gán sản phẩm (gom theo cặp danh mục+hãng để update hàng loạt)
  const groups = new Map<string, string[]>();
  for (const row of plan) {
    const key = `${row.target}|${row.brand?.slug ?? ""}`;
    groups.set(key, [...(groups.get(key) ?? []), row.id]);
  }
  for (const [key, ids] of groups) {
    const [catSlug, brandSlug] = key.split("|");
    await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { categoryId: idBySlug.get(catSlug)!, ...(brandSlug ? { brandId: brandIdBySlug.get(brandSlug)! } : {}) },
    });
  }
  for (const row of plan.filter((r) => r.model !== products.find((p) => p.id === r.id)?.model)) {
    await prisma.product.update({ where: { id: row.id }, data: { model: row.model } });
  }

  // 6) Xoá danh mục sản phẩm cũ không còn trong taxonomy + redirect 301
  const taxonomySlugs = new Set(nodes.map((n) => n.slug));
  const oldCategories = await prisma.category.findMany({ where: { type: "PRODUCT", slug: { notIn: [...taxonomySlugs] } } });
  const redirects: { from: string; to: string }[] = [];
  for (const old of oldCategories) {
    const target = OLD_CATEGORY_REDIRECT[old.slug];
    redirects.push({ from: `/danh-muc/${old.slug}`, to: target ? pathOf(target) : "/san-pham" });
  }
  // URL dạng cũ /danh-muc/<slug mới> cũng chuyển về đường dẫn mới
  for (const node of nodes) redirects.push({ from: `/danh-muc/${node.slug}`, to: pathOf(node.slug) });
  for (const r of redirects) {
    await prisma.redirect.upsert({ where: { from: r.from }, update: { to: r.to, code: 301 }, create: { ...r, code: 301 } });
  }
  if (oldCategories.length) {
    await prisma.category.updateMany({ where: { parentId: { in: oldCategories.map((c) => c.id) } }, data: { parentId: null } });
    await prisma.category.deleteMany({ where: { id: { in: oldCategories.map((c) => c.id) } } });
  }

  // 6b) Xoá thương hiệu rỗng (vd dữ liệu demo cũ "AUTO WORK" trùng AUTOWORK) — không có sản phẩm thì không có trang
  const emptyBrands = await prisma.brand.deleteMany({ where: { products: { none: {} } } });
  if (emptyBrands.count) console.log(`Xoá ${emptyBrands.count} thương hiệu không có sản phẩm.`);

  // 6c) Slug sản phẩm chứa ký tự mã hoá (WordPress lưu "1-2″" thành "1-2%e2%80%b3") → trang 404. Đổi slug sạch + redirect 301.
  // lọc bằng JS: Prisma không thoát "%" trong `contains` (LIKE '%%%' khớp mọi dòng)
  const encoded = (await prisma.product.findMany({ select: { id: true, slug: true } })).filter((p) => p.slug.includes("%"));
  for (const p of encoded) {
    let decoded = p.slug;
    try { decoded = decodeURIComponent(p.slug); } catch {}
    const base = decoded.replace(/[″"]/g, "-inch").normalize("NFD").replace(/[^a-z0-9-]/gi, "").toLowerCase().replace(/-+/g, "-").replace(/^-|-$/g, "");
    let slug = base;
    for (let i = 2; await prisma.product.findFirst({ where: { slug, id: { not: p.id } }, select: { id: true } }); i++) slug = `${base}-${i}`;
    await prisma.product.update({ where: { id: p.id }, data: { slug } });
    // cả dạng mã hoá (thường/HOA) lẫn dạng đã giải mã — tuỳ nơi đã lưu/chia sẻ link cũ
    for (const from of new Set([p.slug, p.slug.replace(/%[0-9a-f]{2}/gi, (m) => m.toUpperCase()), decoded])) {
      const r = { from: `/san-pham/${from}`, to: `/san-pham/${slug}` };
      await prisma.redirect.upsert({ where: { from: r.from }, update: { to: r.to, code: 301 }, create: { ...r, code: 301 } });
    }
  }
  if (encoded.length) console.log(`Đổi ${encoded.length} slug sản phẩm có ký tự mã hoá (kèm redirect 301).`);

  // 7) Ảnh đại diện danh mục = ảnh sản phẩm mới nhất trong cây (nếu chưa có)
  for (const node of nodes) {
    const id = idBySlug.get(node.slug)!;
    const ids = node.leaf ? [id] : nodes.filter((n) => n.parent === node.slug).map((n) => idBySlug.get(n.slug)!);
    const product = await prisma.product.findFirst({
      where: { categoryId: { in: ids }, status: "PUBLISHED", images: { some: {} } },
      orderBy: [{ price: "desc" }, { publishedAt: "desc" }],
      select: { images: { take: 1, orderBy: { position: "asc" }, select: { url: true } } },
    });
    await prisma.category.update({ where: { id }, data: { imageUrl: product?.images[0]?.url ?? null } });
  }

  console.log(`\nĐã ghi DB: ${nodes.length} danh mục, ${brandIdBySlug.size} thương hiệu, ${redirects.length} redirect, xoá ${oldCategories.length} danh mục cũ.`);
}

main().finally(() => prisma.$disconnect());
