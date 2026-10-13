/**
 * Nạp nội dung "content-as-code" từ repo vào DB (idempotent — chạy lại bao nhiêu lần cũng được):
 *   content/categories.json   { "<slug>": { seoTitle, seoDesc, intro, content, faq[] } }
 *   content/brands.json       { "<slug>": { description, seoTitle, seoDesc, content } }
 *   content/posts/<slug>.md   frontmatter (title, slug, excerpt, seoTitle, seoDesc, categories, coverImage?) + thân HTML
 *
 *   pnpm exec tsx scripts/content/apply-content.ts --dry-run   # chỉ kiểm tra
 *   pnpm exec tsx scripts/content/apply-content.ts             # ghi DB (bỏ qua mục có lỗi nghiêm trọng)
 *
 * Chạy SAU classify.ts (cần danh mục mới). Quy trình đầy đủ khi có dump: xem AGENTS.md.
 */
import "dotenv/config";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { type DraftIssue, validateHubContent } from "../../src/lib/content-validate";
import { POLICIES } from "../../src/lib/policies";

const DRY_RUN = process.argv.includes("--dry-run");
const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL!) });
const BRAND_CATEGORY_MIN = 6; // khớp src/lib/urls.ts

type Faq = { question: string; answer: string };
type CategoryContent = { seoTitle?: string; seoDesc?: string; intro?: string; content?: string; faq?: Faq[] };
type BrandContent = { description?: string; seoTitle?: string; seoDesc?: string; content?: string };
type PostFile = { title: string; slug: string; excerpt?: string; seoTitle?: string; seoDesc?: string; categories: string[]; coverImage?: string; body: string };

const readJson = <T>(file: string): T => (existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as T) : ({} as T));

function parsePost(file: string): PostFile {
  const raw = readFileSync(file, "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`${file}: thiếu frontmatter`);
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return {
    title: meta.title,
    slug: meta.slug,
    excerpt: meta.excerpt,
    seoTitle: meta.seoTitle,
    seoDesc: meta.seoDesc,
    coverImage: meta.coverImage || undefined,
    categories: (meta.categories ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    body: match[2].trim(),
  };
}

/** Mọi đường dẫn nội bộ hợp lệ để kiểm tra link trong nội dung. */
async function knownPaths() {
  const [categories, brands, combos] = await Promise.all([
    prisma.category.findMany({ where: { type: "PRODUCT" }, select: { id: true, slug: true, parentId: true, parent: { select: { slug: true } } } }),
    prisma.brand.findMany({ select: { id: true, slug: true } }),
    prisma.product.groupBy({ by: ["brandId", "categoryId"], where: { status: "PUBLISHED", brandId: { not: null }, categoryId: { not: null } }, _count: { _all: true } }),
  ]);
  const paths = new Set<string>(["/", "/san-pham", "/thuong-hieu", "/kien-thuc", "/lien-he", "/cua-hang", ...Object.keys(POLICIES).map((s) => `/${s}`)]);
  const byId = new Map(categories.map((c) => [c.id, c]));
  for (const c of categories) paths.add(c.parent ? `/${c.parent.slug}/${c.slug}` : `/${c.slug}`);
  const brandSlug = new Map(brands.map((b) => [b.id, b.slug]));
  for (const b of brands) paths.add(`/thuong-hieu/${b.slug}`);
  const comboCount = new Map<string, number>();
  for (const row of combos) {
    for (let cat = byId.get(row.categoryId!); cat; cat = cat.parentId ? byId.get(cat.parentId) : undefined) {
      const key = `/thuong-hieu/${brandSlug.get(row.brandId!)}/${cat.slug}`;
      comboCount.set(key, (comboCount.get(key) ?? 0) + row._count._all);
    }
  }
  for (const [path, n] of comboCount) if (n >= BRAND_CATEGORY_MIN) paths.add(path);
  return paths;
}

/**
 * Trang hãng × danh mục chỉ tồn tại khi hãng có ≥ 6 sản phẩm trong danh mục — số này đổi theo dữ liệu
 * (phân loại lại, nạp dump). Link tới trang không còn tồn tại → tự đổi về trang hãng, kèm cảnh báo.
 */
function downgradeBrandCategoryLinks(html: string | undefined, paths: Set<string>, notes: string[]) {
  if (!html) return html;
  return html.replace(/href="(\/thuong-hieu\/([^"/]+)\/[^"/]+)"/g, (whole, href: string, brand: string) => {
    if (paths.has(href) || !paths.has(`/thuong-hieu/${brand}`)) return whole;
    notes.push(`${href} → /thuong-hieu/${brand}`);
    return `href="/thuong-hieu/${brand}"`;
  });
}

function report(label: string, issues: DraftIssue[]) {
  if (issues.length) console.log(`  ${issues.some((i) => i.level === "error") ? "✗" : "!"} ${label}\n      ${issues.map((i) => `[${i.level}] ${i.message}`).join("\n      ")}`);
}

async function main() {
  const paths = await knownPaths();
  const categories = readJson<Record<string, CategoryContent>>("content/categories.json");
  const brands = readJson<Record<string, BrandContent>>("content/brands.json");
  const postFiles = existsSync("content/posts") ? readdirSync("content/posts").filter((f) => f.endsWith(".md")).map((f) => parsePost(`content/posts/${f}`)) : [];
  // bài viết mới cũng là đường dẫn hợp lệ (bài này link bài kia)
  for (const post of postFiles) paths.add(`/kien-thuc/${post.slug}`);

  let applied = 0;
  let skipped = 0;

  console.log(`Danh mục: ${Object.keys(categories).length}`);
  for (const [slug, c] of Object.entries(categories)) {
    const notes: string[] = [];
    c.content = downgradeBrandCategoryLinks(c.content, paths, notes);
    if (notes.length) console.log(`  ! ${slug}: đổi link hãng×danh mục không còn đủ sản phẩm: ${notes.join(", ")}`);
    const issues = validateHubContent({ seoTitle: c.seoTitle, seoDesc: c.seoDesc, html: c.content, texts: [c.intro, ...(c.faq ?? []).flatMap((f) => [f.question, f.answer])] }, { knownPaths: paths });
    report(slug, issues);
    const exists = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) { console.log(`  ? ${slug}: không có danh mục này trong DB`); skipped++; continue; }
    if (issues.some((i) => i.level === "error")) { skipped++; continue; }
    if (!DRY_RUN) {
      await prisma.category.update({
        where: { slug },
        data: { seoTitle: c.seoTitle ?? null, seoDesc: c.seoDesc ?? null, intro: c.intro ?? null, content: c.content ?? null, faq: c.faq?.length ? c.faq : undefined },
      });
    }
    applied++;
  }

  console.log(`Thương hiệu: ${Object.keys(brands).length}`);
  for (const [slug, b] of Object.entries(brands)) {
    b.content = downgradeBrandCategoryLinks(b.content, paths, []);
    const issues = validateHubContent({ seoTitle: b.seoTitle, seoDesc: b.seoDesc, html: b.content, texts: [b.description] }, { knownPaths: paths });
    report(slug, issues);
    const exists = await prisma.brand.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) { console.log(`  ? ${slug}: không có thương hiệu này trong DB`); skipped++; continue; }
    if (issues.some((i) => i.level === "error")) { skipped++; continue; }
    if (!DRY_RUN) {
      await prisma.brand.update({ where: { slug }, data: { description: b.description ?? null, seoTitle: b.seoTitle ?? null, seoDesc: b.seoDesc ?? null, content: b.content ?? null } });
    }
    applied++;
  }

  console.log(`Bài kiến thức: ${postFiles.length}`);
  const author = await prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" }, select: { id: true } });
  if (!author && postFiles.length) throw new Error("Cần ít nhất 1 tài khoản ADMIN làm tác giả bài viết.");
  const topic = DRY_RUN
    ? null
    : await prisma.category.upsert({ where: { slug: "kien-thuc" }, update: {}, create: { name: "Kiến thức", slug: "kien-thuc", type: "POST" } });
  for (const post of postFiles) {
    const notes: string[] = [];
    post.body = downgradeBrandCategoryLinks(post.body, paths, notes) ?? "";
    if (notes.length) console.log(`  ! ${post.slug}: đổi link: ${notes.join(", ")}`);
    const issues = validateHubContent({ seoTitle: post.seoTitle, seoDesc: post.seoDesc, html: post.body, texts: [post.title, post.excerpt] }, { knownPaths: paths });
    if (!post.title || !post.slug) issues.push({ level: "error", code: "frontmatter", message: "Thiếu title/slug." });
    report(post.slug, issues);
    if (issues.some((i) => i.level === "error")) { skipped++; continue; }
    // ảnh bìa: ảnh đại diện của danh mục đầu tiên bài viết nói tới (nếu không khai báo)
    const cover =
      post.coverImage ??
      (await prisma.category.findFirst({ where: { slug: { in: post.categories }, imageUrl: { not: null } }, select: { imageUrl: true } }))?.imageUrl ??
      null;
    if (!DRY_RUN) {
      const data = {
        title: post.title,
        excerpt: post.excerpt ?? null,
        content: post.body,
        seoTitle: post.seoTitle ?? null,
        seoDesc: post.seoDesc ?? null,
        coverImage: cover,
        status: "PUBLISHED" as const,
        categoryId: topic!.id,
      };
      await prisma.post.upsert({
        where: { slug: post.slug },
        update: data,
        create: { ...data, slug: post.slug, authorId: author!.id, publishedAt: new Date() },
      });
    }
    applied++;
  }

  console.log(`\n${DRY_RUN ? "[dry-run] " : ""}Áp dụng: ${applied} · Bỏ qua (lỗi/không tồn tại): ${skipped}`);
}

main().finally(() => prisma.$disconnect());
