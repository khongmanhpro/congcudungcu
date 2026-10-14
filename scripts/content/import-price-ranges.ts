/**
 * Nạp khoảng giá tham khảo (khảo sát đối thủ) cho sản phẩm bị khoá giá do chính sách đại lý/MAP.
 * Chỉ ghi khi Product.price hiện tại = 0 — sản phẩm đã có giá thật không bị đụng tới.
 *
 * File CSV đầu vào (xuất từ Excel/Sheets), 3 cột, có header:
 *   slug,priceMin,priceMax
 *   bua-nhua-stanley-57-526,150000,220000
 * `slug` lấy từ URL sản phẩm (/san-pham/<slug>) hoặc cột `sku` thay cho `slug` nếu tiện hơn.
 *
 * Dùng: npx tsx scripts/content/import-price-ranges.ts <file.csv> [--dry-run]
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL!) });
const dryRun = process.argv.includes("--dry-run");
const file = process.argv[2];

function parseCsv(text: string): { key: string; keyField: "slug" | "sku"; min: number; max: number }[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const keyField: "slug" | "sku" = header.includes("slug") ? "slug" : "sku";
  const keyIdx = header.indexOf(keyField);
  const minIdx = header.indexOf("pricemin");
  const maxIdx = header.indexOf("pricemax");
  if (keyIdx < 0 || minIdx < 0 || maxIdx < 0) {
    throw new Error(`CSV cần cột slug (hoặc sku), priceMin, priceMax — header đọc được: ${header.join(",")}`);
  }
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    return { key: cols[keyIdx], keyField, min: Number(cols[minIdx]), max: Number(cols[maxIdx]) };
  });
}

async function main() {
  if (!file) {
    console.error("Dùng: npx tsx scripts/content/import-price-ranges.ts <file.csv> [--dry-run]");
    process.exit(1);
  }
  const rows = parseCsv(readFileSync(file, "utf-8"));
  let applied = 0;
  let skippedHasPrice = 0;
  let skippedNotFound = 0;
  let skippedInvalid = 0;

  for (const row of rows) {
    if (!row.key || !Number.isFinite(row.min) || !Number.isFinite(row.max) || row.min <= 0 || row.max < row.min) {
      console.log(`! Bỏ qua dòng không hợp lệ: ${JSON.stringify(row)}`);
      skippedInvalid++;
      continue;
    }
    const product = await prisma.product.findUnique({
      where: row.keyField === "slug" ? { slug: row.key } : { sku: row.key },
      select: { id: true, name: true, price: true, priceMin: true, priceMax: true },
    });
    if (!product) {
      console.log(`! Không tìm thấy sản phẩm ${row.keyField}="${row.key}"`);
      skippedNotFound++;
      continue;
    }
    if (product.price > 0) {
      console.log(`= ${product.name} đã có giá thật (${product.price}đ), bỏ qua khoảng giá`);
      skippedHasPrice++;
      continue;
    }
    if (product.priceMin === row.min && product.priceMax === row.max) {
      console.log(`= ${product.name} đã đúng khoảng giá`);
      continue;
    }
    console.log(`${dryRun ? "~ (dry-run)" : "~"} ${product.name}: ${row.min} - ${row.max}`);
    if (!dryRun) {
      await prisma.product.update({ where: { id: product.id }, data: { priceMin: row.min, priceMax: row.max } });
    }
    applied++;
  }

  console.log(`\nXong: ${applied} cập nhật, ${skippedHasPrice} đã có giá thật, ${skippedNotFound} không tìm thấy, ${skippedInvalid} dòng lỗi.`);
}

main().finally(() => prisma.$disconnect());
