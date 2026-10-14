/**
 * Tải toàn bộ ảnh sản phẩm từ site cũ (UPLOADS_FALLBACK_ORIGIN, xem next.config.ts) về
 * public/uploads/: đổi tên file không có từ khóa (toàn số, mã vô nghĩa, lẫn đuôi "wmjsc") sang
 * tên mô tả, chuyển mọi ảnh sang WebP, rồi cập nhật lại url trong DB. Category.imageUrl và
 * Post.coverImage luôn trùng một url nào đó trong ProductImage (đã kiểm tra), nên chỉ cần tải
 * theo ProductImage rồi áp lại mapping cho cả 2 bảng kia — không cần tải riêng.
 *
 * Sau khi chạy xong, ảnh phục vụ trực tiếp từ public/uploads/ (khớp docker-compose.yml đã mount
 * sẵn thư mục này) — không còn phụ thuộc site congcudungcu.vn đang chạy thật nữa.
 *
 *   pnpm exec tsx scripts/content/migrate-images.ts --dry-run   # chỉ in kế hoạch đổi tên
 *   pnpm exec tsx scripts/content/migrate-images.ts             # tải + chuyển WebP + cập nhật DB
 *
 * Resumable: ảnh tải xong được ghi vào manifest; chạy lại bỏ qua ảnh đã xong, tải tiếp ảnh còn
 * thiếu hoặc bị lỗi lần trước — an toàn nếu bị ngắt giữa chừng (file ~1.7GB, mất vài chục phút).
 */
import "dotenv/config";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { slugify } from "../../src/lib/slug";

const DRY_RUN = process.argv.includes("--dry-run");
const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL!) });
const ORIGIN = process.env.UPLOADS_FALLBACK_ORIGIN;
const OUT_DIR = "public/uploads";
const MANIFEST_FILE = "tmp/image-migration/manifest.json";
const CONCURRENCY = 8;

type ManifestEntry = { filename: string; bytes: number };
type Manifest = Record<string, ManifestEntry>; // oldUrl -> kết quả đã tải

function loadManifest(): Manifest {
  if (!existsSync(MANIFEST_FILE)) return {};
  try {
    return JSON.parse(readFileSync(MANIFEST_FILE, "utf8"));
  } catch {
    return {};
  }
}
function saveManifest(m: Manifest) {
  mkdirSync("tmp/image-migration", { recursive: true });
  writeFileSync(MANIFEST_FILE, JSON.stringify(m, null, 1));
}

/** "257012", "W073309" (gần như không có chữ cái thật) → tên vô nghĩa, cần đặt lại theo tên sản phẩm. */
function looksMeaningless(basename: string): boolean {
  return basename.replace(/[^a-z]/gi, "").length < 4;
}

/** Đuôi "wmjsc"/"wmsjc" (Workman JSC) lẫn vào tên file ảnh crawl từ site cũ — cùng loại rác đã dọn ở Product.name. */
function stripNoise(basename: string): string {
  return basename.replace(/[-_]?wm[js]?sc$/i, "");
}

type ImgRow = { url: string; product: { name: string; slug: string; model: string | null; sku: string | null } };

function planFilename(url: string, product: ImgRow["product"], usedNames: Set<string>): string | null {
  const m = url.match(/\/([^/]+)\.([a-zA-Z0-9]+)$/);
  if (!m) return null;
  // một số url gốc có đuôi đôi kiểu "...-600x600.jpg.webp" (site cũ convert sang webp nhưng
  // không bỏ đuôi gốc) — bỏ đuôi ảnh thừa còn dính trong base trước khi làm sạch tên
  const [, baseRaw] = m;
  const base = baseRaw.replace(/\.(jpe?g|png|webp|avif)$/i, "");
  const cleaned = stripNoise(base.toLowerCase());
  let candidateBase: string;
  if (looksMeaningless(cleaned)) {
    // tên gốc không có từ khóa → đặt theo tên sản phẩm; mã model thường đã nằm sẵn trong tên,
    // chỉ nối thêm khi chưa có (tránh "...-153404-153404")
    const nameSlug = slugify(product.name);
    const modelSlug = slugify(product.model || product.sku || "");
    candidateBase = (modelSlug && !nameSlug.includes(modelSlug) ? `${nameSlug}-${modelSlug}` : nameSlug) || slugify(product.slug);
  } else {
    candidateBase = slugify(cleaned);
  }
  candidateBase = candidateBase.slice(0, 100);
  let name = `${candidateBase}.webp`;
  for (let i = 2; usedNames.has(name); i++) name = `${candidateBase}-${i}.webp`;
  usedNames.add(name);
  return name;
}

async function main() {
  if (!ORIGIN && !DRY_RUN) throw new Error("Thiếu UPLOADS_FALLBACK_ORIGIN trong .env — không biết tải ảnh từ đâu.");

  // nguồn sự thật duy nhất cho mọi url ảnh — Category.imageUrl/Post.coverImage chỉ là bản sao
  const images = await prisma.productImage.findMany({
    orderBy: [{ productId: "asc" }, { position: "asc" }],
    select: { url: true, product: { select: { name: true, slug: true, model: true, sku: true } } },
  });
  const byUrl = new Map<string, ImgRow>();
  for (const img of images) if (!byUrl.has(img.url)) byUrl.set(img.url, img); // ảnh dùng chung nhiều sp: đặt tên theo sp đầu tiên

  const manifest = loadManifest();
  const usedNames = new Set(Object.values(manifest).map((v) => v.filename));

  const todo: { oldUrl: string; filename: string }[] = [];
  for (const [url, row] of byUrl) {
    if (manifest[url]) continue; // đã tải ở lần chạy trước
    const filename = planFilename(url, row.product, usedNames);
    if (filename) todo.push({ oldUrl: url, filename });
  }

  console.log(`${byUrl.size} ảnh khác nhau · đã có ${Object.keys(manifest).length} (lần trước) · còn ${todo.length} cần tải.`);
  if (DRY_RUN) {
    for (const t of todo.slice(0, 30)) console.log(`  ${t.oldUrl} → /uploads/${t.filename}`);
    if (todo.length > 30) console.log(`  … và ${todo.length - 30} ảnh khác`);
    return;
  }

  mkdirSync(OUT_DIR, { recursive: true });
  let ok = 0;
  let fail = 0;
  let totalBytes = 0;
  const failed: string[] = [];
  let cursor = 0;

  async function worker() {
    for (;;) {
      const i = cursor++;
      if (i >= todo.length) return;
      const item = todo[i];
      try {
        const res = await fetch(`${ORIGIN}${item.oldUrl}`, { signal: AbortSignal.timeout(30000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        const webp = await sharp(buf).webp({ quality: 82 }).toBuffer(); // giải mã lại qua sharp luôn kiểm tra ảnh hợp lệ
        writeFileSync(`${OUT_DIR}/${item.filename}`, webp);
        manifest[item.oldUrl] = { filename: item.filename, bytes: webp.length };
        totalBytes += webp.length;
        ok++;
      } catch (error) {
        fail++;
        failed.push(item.oldUrl);
        console.log(`  ✗ ${item.oldUrl}: ${error instanceof Error ? error.message : error}`);
      }
      if ((ok + fail) % 100 === 0) {
        console.log(`  … ${ok + fail}/${todo.length} (lỗi ${fail}, đã tải ${(totalBytes / 1e6).toFixed(0)}MB)`);
        saveManifest(manifest);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  saveManifest(manifest);
  console.log(`\nTải xong lượt này: ${ok} ảnh, lỗi ${fail}, ${(totalBytes / 1e6).toFixed(0)}MB.`);
  if (failed.length) console.log(`Ảnh lỗi (giữ nguyên url cũ, vẫn chạy qua UPLOADS_FALLBACK_ORIGIN): \n  ${failed.join("\n  ")}`);

  // cập nhật DB cho mọi url đã tải thành công (gồm cả lần chạy trước) — bảng nào cũng update
  // bằng updateMany nên không cần biết trước bảng nào đang dùng url này
  let updated = 0;
  for (const [oldUrl, entry] of Object.entries(manifest)) {
    const newUrl = `/uploads/${entry.filename}`;
    if (oldUrl === newUrl) continue;
    const [a, b, c] = await prisma.$transaction([
      prisma.productImage.updateMany({ where: { url: oldUrl }, data: { url: newUrl } }),
      prisma.category.updateMany({ where: { imageUrl: oldUrl }, data: { imageUrl: newUrl } }),
      prisma.post.updateMany({ where: { coverImage: oldUrl }, data: { coverImage: newUrl } }),
    ]);
    updated += a.count + b.count + c.count;
  }
  console.log(`Cập nhật ${updated} dòng (ProductImage/Category/Post) sang url mới trong public/uploads/.`);
}

main().finally(() => prisma.$disconnect());
