/**
 * Set các Setting suy ra được an toàn từ dữ liệu đã có (không cần dump):
 * - store_opening_hours: định dạng schema.org (Mo-Sa 07:30-17:30) khớp business_hours mặc định
 *   đã áp dụng ở Phase 1 (src/app/(store)/lien-he/page.tsx, src/app/(store)/cua-hang/page.tsx).
 * Idempotent — chạy lại không gây lỗi. KHÔNG set store_lat/store_lng: toạ độ sai sẽ chỉ sai đường
 * cho khách, phải lấy thật từ Google Maps (xem /admin/settings, field "Vĩ độ/Kinh độ cửa hàng").
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL!) });

const SETTINGS: Record<string, string> = {
  store_opening_hours: "Mo-Sa 07:30-17:30",
};

async function main() {
  for (const [key, value] of Object.entries(SETTINGS)) {
    const existing = await prisma.setting.findUnique({ where: { key } });
    if (existing?.value === value) {
      console.log(`= ${key} đã đúng ("${value}")`);
      continue;
    }
    await prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
    console.log(`${existing ? "~" : "+"} ${key} = "${value}"${existing ? ` (trước: "${existing.value}")` : ""}`);
  }
}

main().finally(() => prisma.$disconnect());
