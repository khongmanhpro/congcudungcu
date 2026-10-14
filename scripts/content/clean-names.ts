/**
 * Dọn rác trong Product.name sót lại từ crawl trang cũ: tên công ty "Workman JSC" lẫn vào
 * (brand đã có trường riêng), cụm quảng cáo cấm ("siêu bền"…), mẩu quảng cáo ở cuối tên chỉ
 * toàn từ chung chung không có thông tin ("Chính Hãng, Giá Tốt"…), khoảng trắng kép, rác HTML sót.
 *
 * Đây là dữ liệu — không phải nội dung AI viết — nên chỉ cắt bỏ rác, KHÔNG viết lại hay thêm chữ.
 * Ảnh hưởng tới các chỗ hiển thị trực tiếp Product.name: thẻ <h1>, JSON-LD "name", breadcrumb,
 * sitemap, llms.txt/llms-full.txt, feed Google Merchant — đều chưa dùng seoTitle nên quan trọng
 * với AEO (AI đọc đúng tên gì để trích dẫn).
 *
 *   pnpm exec tsx scripts/content/clean-names.ts --dry-run   # chỉ in trước/sau, không ghi DB
 *   pnpm exec tsx scripts/content/clean-names.ts             # ghi DB
 *
 * Idempotent: chạy lại trên tên đã sạch thì không đổi gì.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const DRY_RUN = process.argv.includes("--dry-run");
const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL!) });

// Từ/cụm quảng cáo cấm theo src/lib/content-validate.ts — áp dụng luôn cho tên sản phẩm để nhất quán.
const BANNED_WORDS = ["siêu bền", "tốt nhất", "hàng đầu thế giới", "giá rẻ nhất", "vĩnh viễn", "100% không", "đỉnh cao"];

// Cụm/ từ chung chung không mang thông tin kỹ thuật, hay bị nhét ở cuối tên dạng quảng cáo.
// Chỉ cắt bỏ khi CẢ MẨU cuối tên (tách bởi dấu phẩy) toàn là các cụm này — không đụng tới mẩu
// có từ mô tả cụ thể (vd "Đa Năng", "Cắt Mạnh", "Drop Forged", "Quick-Release"…).
const FILLER = [
  "hang chinh hang", "hang nhap khau chinh hang", "chinh hang",
  "gia tot", "gia tot 2025",
  "do ben cao", "do ben vuot troi", "ben bi",
  "chat luong cao", "chat luong cong nghiep", "hieu suat cao",
  "de su dung", "chuan cong nghiep", "cong nghiep",
];

const stripAccents = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, (m) => (m === "đ" ? "d" : "D")).toLowerCase();

/** Tên công ty vận hành site (Workman JSC) lẫn vào tên sp từ trang cũ — brand đã có trường riêng. */
function stripCompanyTag(name: string): string {
  return name.replace(/\s*(\||tại)\s*workman\s*jsc\b.*$/i, "").trimEnd();
}

/** Mẩu rác do crawl sai (copy cả nhãn "Mô tả sản phẩm" của trang web). */
function stripScrapeArtifacts(name: string): string {
  return name.replace(/\s*mô tả sản phẩm\s*$/i, "").trimEnd();
}

function stripBannedWords(name: string): string {
  let out = name;
  for (const w of BANNED_WORDS) {
    out = out.replace(new RegExp(`[\\s,–-]*${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "gi"), "");
  }
  return out;
}

/** Nếu mẩu cuối cùng (sau "–" hoặc "|") toàn là cụm chung chung → cắt cả mẩu đó. */
function stripFillerTail(name: string): string {
  const m = name.match(/^(.*?)\s*[–|]\s*([^–|]+)$/);
  if (!m) return name;
  const [, head, tail] = m;
  const parts = tail.split(/[,•]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return name;
  const allFiller = parts.every((p) => FILLER.includes(stripAccents(p).replace(/[^a-z0-9 ]/g, "").trim()));
  return allFiller ? head.trimEnd() : name;
}

function clean(name: string): string {
  let out = name;
  out = stripCompanyTag(out);
  out = stripScrapeArtifacts(out);
  out = stripBannedWords(out); // trước filler-tail: bỏ "siêu bền" có thể biến cả mẩu còn lại thành toàn filler
  out = stripFillerTail(out);
  out = out.replace(/\s{2,}/g, " ").replace(/[\s,–|]+$/, "").trim();
  return out;
}

async function main() {
  const products = await prisma.product.findMany({ select: { id: true, name: true } });
  let changed = 0;
  for (const p of products) {
    const next = clean(p.name);
    if (next === p.name || !next) continue;
    changed++;
    console.log(`  - ${p.name}\n  + ${next}\n`);
    if (!DRY_RUN) await prisma.product.update({ where: { id: p.id }, data: { name: next } });
  }
  console.log(`${DRY_RUN ? "[dry-run] " : ""}Đổi ${changed}/${products.length} tên sản phẩm.`);
}

main().finally(() => prisma.$disconnect());
