/**
 * Xoá cụm "theo tên sản phẩm" lộ liễu trong Product.description — nội dung sinh hàng loạt
 * từng để lộ việc AI suy đoán thông số từ tên sản phẩm thay vì dữ liệu thật. Idempotent.
 * `--dry-run` chỉ in diff, không ghi DB.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL!) });

function clean(html: string): string {
  let out = html;
  // biến thể đầu câu viết hoa: "Theo tên sản phẩm, X..." → xoá, viết hoa chữ đầu của phần còn lại
  out = out.replace(/Theo tên sản phẩm,\s*(\p{Lu})/gu, "$1");
  out = out.replace(/Theo tên sản phẩm,\s*(\p{Ll})/gu, (_, c: string) => c.toUpperCase());
  out = out.replace(/ghi theo tên sản phẩm,/g, "ghi,");
  out = out.replace(/\s*\(theo tên sản phẩm\)/g, "");
  out = out.replace(/\s*theo tên sản phẩm\)/g, ")");
  out = out.replace(/\s*theo tên sản phẩm;\s*/g, " ");
  out = out.replace(/\s*theo tên sản phẩm,\s*/g, " ");
  out = out.replace(/\s*theo tên sản phẩm\s*/g, " ");
  out = out.replace(/\(\s*\)/g, "");
  out = out.replace(/[ \t]{2,}/g, " ");
  out = out.replace(/ ([.,;:)])/g, "$1");
  out = out.replace(/\(\s+/g, "(");
  // bullet points trở thành rỗng (chỉ còn nhãn + dấu chấm) sau khi xoá cụm → bỏ cả bullet
  out = out.replace(/<li><strong>[^<]*:<\/strong>\.<\/li>/g, "");
  return out.trim();
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const products = await prisma.product.findMany({
    where: { OR: [{ description: { contains: "theo tên sản phẩm" } }, { description: { contains: "Theo tên sản phẩm" } }] },
    select: { id: true, name: true, description: true },
  });

  console.log(`Tìm thấy ${products.length} sản phẩm có cụm "theo tên sản phẩm".`);

  let changed = 0;
  let stillDirty = 0;
  for (const p of products) {
    const next = clean(p.description);
    if (next === p.description) continue;
    changed++;
    if (/theo tên sản phẩm/i.test(next)) {
      stillDirty++;
      console.log(`[CÒN SÓT] ${p.name} (${p.id})`);
    }
    if (dryRun && changed <= 5) {
      console.log(`--- ${p.name} ---`);
      console.log("TRƯỚC:", p.description.slice(0, 300));
      console.log("SAU:  ", next.slice(0, 300));
    }
    if (!dryRun) {
      await prisma.product.update({ where: { id: p.id }, data: { description: next } });
    }
  }

  console.log(`${dryRun ? "[DRY-RUN] Sẽ sửa" : "Đã sửa"} ${changed}/${products.length} sản phẩm. Còn sót cụm sau khi sửa: ${stillDirty}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
