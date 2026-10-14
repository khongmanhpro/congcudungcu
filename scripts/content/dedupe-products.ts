/**
 * Gộp 5 nhóm sản phẩm trùng lặp do lỗi import (cùng tên+model, không đơn hàng/đánh giá nào gắn
 * vào bản bị xoá — đã kiểm tra thủ công trước khi viết script này, KHÔNG dùng heuristic chung vì
 * có nhóm tên trùng nhưng là biến thể màu thật (Tủ dụng cụ CSPS) — nhóm đó cố tình bỏ qua.
 * Idempotent: bỏ qua nhóm nếu slug "xoá" đã không còn tồn tại.
 * `--dry-run` chỉ in kế hoạch, không ghi DB.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL!) });
const dryRun = process.argv.includes("--dry-run");

type Group = {
  keep: string;
  remove: string;
  /** true nếu ảnh của "remove" khác ảnh của "keep" — cần chuyển ảnh đó sang "keep" trước khi xoá */
  moveImage: boolean;
  /** nếu "remove" có giá thật mà "keep" không có (hoặc ngược lại), lấy giá lớn hơn */
  reconcilePrice: boolean;
  /** ép giá "keep" về giá trị này (dùng khi 2 bản trùng có giá mâu thuẫn, đã xác nhận giá đúng) */
  forcePrice?: number;
};

const GROUPS: Group[] = [
  { keep: "3-den-pha-3aaa-everbrite-e021007", remove: "3-den-pha-3aaa-everbrite-e021007-2", moveImage: true, reconcilePrice: true },
  { keep: "co-le-tu-dong-vong-mieng-18mm-0189-0180-matador", remove: "co-le-tu-dong-vong-mieng-18mm-0189-0180-matador-2", moveImage: false, reconcilePrice: false },
  { keep: "mo-let-co-dieu-chinh-375mm-15-workpro-w072005", remove: "mo-let-co-dieu-chinh-375mm-15-workpro-w072005-2", moveImage: false, reconcilePrice: false },
  { keep: "mo-let-dieu-chinh-can-nhua-12-300mm-workpro-w072011", remove: "mo-let-dieu-chinh-can-nhua-12-300mm-workpro-w072011-2", moveImage: true, reconcilePrice: false },
  { keep: "duc-lo-roang-37mm-toptul-saac4737", remove: "duc-lo-roang-37mm-toptul-saac4737-2", moveImage: false, reconcilePrice: false },
  // Giá đúng là 78.000đ (bản "-2") theo sếp xác nhận — giữ slug gốc, ép giá 78.000đ, xoá bản 87.000đ sai.
  { keep: "co-le-vong-mieng-23mm-workpro-w073225", remove: "co-le-vong-mieng-23mm-workpro-w073225-2", moveImage: false, reconcilePrice: false, forcePrice: 78000 },
];

async function main() {
  for (const g of GROUPS) {
    const [keep, remove] = await Promise.all([
      prisma.product.findUnique({ where: { slug: g.keep }, include: { images: true } }),
      prisma.product.findUnique({ where: { slug: g.remove }, include: { images: true } }),
    ]);
    if (!remove) {
      console.log(`= ${g.remove} đã được xử lý trước đó, bỏ qua`);
      continue;
    }
    if (!keep) {
      console.log(`! ${g.keep} không tìm thấy — bỏ qua nhóm`);
      continue;
    }
    console.log(`--- Gộp "${remove.name}" ---`);
    console.log(`  giữ:  ${keep.slug} (giá ${keep.price})`);
    console.log(`  xoá:  ${remove.slug} (giá ${remove.price})`);

    if (dryRun) continue;

    await prisma.$transaction(async (tx) => {
      if (g.moveImage) {
        const maxPos = Math.max(-1, ...keep.images.map((i) => i.position));
        for (const img of remove.images) {
          await tx.productImage.update({ where: { id: img.id }, data: { productId: keep.id, position: maxPos + 1 + img.position } });
        }
      }
      if (g.reconcilePrice && remove.price > keep.price) {
        await tx.product.update({ where: { id: keep.id }, data: { price: remove.price } });
      }
      if (g.forcePrice !== undefined && keep.price !== g.forcePrice) {
        await tx.product.update({ where: { id: keep.id }, data: { price: g.forcePrice } });
      }
      await tx.product.delete({ where: { id: remove.id } });
      await tx.redirect.upsert({
        where: { from: `/san-pham/${remove.slug}` },
        create: { from: `/san-pham/${remove.slug}`, to: `/san-pham/${keep.slug}`, code: 301 },
        update: { to: `/san-pham/${keep.slug}` },
      });
    });
    console.log(`  xong, redirect /san-pham/${remove.slug} -> /san-pham/${keep.slug}`);
  }
}

main().finally(() => prisma.$disconnect());
