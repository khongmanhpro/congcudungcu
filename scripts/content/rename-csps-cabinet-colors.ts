/**
 * "Tủ dụng cụ CSPS 142cm - 10 hộc kéo" có 4 bản ghi cùng tên nhưng 4 ảnh khác nhau (đen/đỏ/đỏ-đen/
 * đen-đỏ) — đây là 4 màu khác nhau, không phải trùng lặp (xem scripts/content/dedupe-products.ts,
 * nhóm này cố tình không gộp). Sếp xác nhận: đổi tên thêm màu, giữ cả 4 sản phẩm riêng.
 * Đổi cả slug (301 redirect từ slug cũ) để URL mô tả đúng màu, không phải hậu tố số vô nghĩa.
 * Idempotent — chạy lại không gây lỗi.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL!) });

const ITEMS = [
  {
    oldSlug: "tu-dung-cu-csps-142cm-10-hoc-keo",
    newSlug: "tu-dung-cu-csps-142cm-10-hoc-keo-den",
    name: "Tủ dụng cụ CSPS 142cm - 10 hộc kéo (Đen)",
    seoTitle: "CSPS tủ dụng cụ 142cm 10 hộc kéo (Đen)",
  },
  {
    oldSlug: "tu-dung-cu-csps-142cm-10-hoc-keo-2",
    newSlug: "tu-dung-cu-csps-142cm-10-hoc-keo-do",
    name: "Tủ dụng cụ CSPS 142cm - 10 hộc kéo (Đỏ)",
    seoTitle: "Tủ dụng cụ 10 hộc kéo CSPS rộng 142cm cho gara nhà (Đỏ)",
  },
  {
    oldSlug: "tu-dung-cu-csps-142cm-10-hoc-keo-3",
    newSlug: "tu-dung-cu-csps-142cm-10-hoc-keo-do-den",
    name: "Tủ dụng cụ CSPS 142cm - 10 hộc kéo (Đỏ - Đen)",
    seoTitle: "Tủ đồ nghề CSPS 142cm 10 hộc cho xưởng bảo trì (Đỏ - Đen)",
  },
  {
    oldSlug: "tu-dung-cu-csps-142cm-10-hoc-keo-4",
    newSlug: "tu-dung-cu-csps-142cm-10-hoc-keo-den-do",
    name: "Tủ dụng cụ CSPS 142cm - 10 hộc kéo (Đen - Đỏ)",
    seoTitle: "Tủ dụng cụ CSPS 142cm 10 hộc kéo cho gara ô tô (Đen - Đỏ)",
  },
];

async function main() {
  for (const item of ITEMS) {
    const bySlug = async (slug: string) => prisma.product.findUnique({ where: { slug } });
    let product = await bySlug(item.oldSlug);
    if (!product) {
      product = await bySlug(item.newSlug);
      if (product && product.name === item.name) {
        console.log(`= ${item.newSlug} đã đổi tên trước đó, bỏ qua`);
        continue;
      }
      if (!product) {
        console.log(`! Không tìm thấy ${item.oldSlug} lẫn ${item.newSlug} — bỏ qua`);
        continue;
      }
    }
    console.log(`--- ${item.oldSlug} -> ${item.newSlug} ---`);
    console.log(`  tên:      "${product.name}" -> "${item.name}"`);
    console.log(`  seoTitle: "${product.seoTitle}" -> "${item.seoTitle}"`);

    await prisma.$transaction([
      prisma.product.update({
        where: { id: product.id },
        data: { slug: item.newSlug, name: item.name, seoTitle: item.seoTitle },
      }),
      prisma.redirect.upsert({
        where: { from: `/san-pham/${item.oldSlug}` },
        create: { from: `/san-pham/${item.oldSlug}`, to: `/san-pham/${item.newSlug}`, code: 301 },
        update: { to: `/san-pham/${item.newSlug}` },
      }),
    ]);
    console.log(`  xong, redirect /san-pham/${item.oldSlug} -> /san-pham/${item.newSlug}`);
  }
}

main().finally(() => prisma.$disconnect());
