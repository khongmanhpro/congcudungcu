/**
 * Thêm link 2 website khác của công ty (wokin.vn, workmanjsc.vn) vào chân trang.
 * Dùng Setting.footer_sites có sẵn (xem src/components/store/layout.tsx, /admin/settings).
 * CHỈ ghi khi footer_sites đang trống — tránh ghi đè nếu sau này ai đó sửa tay qua /admin/settings.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL!) });

const VALUE = "WOKIN.VN | https://wokin.vn\nWORKMANJSC.VN | https://workmanjsc.vn";

async function main() {
  const existing = await prisma.setting.findUnique({ where: { key: "footer_sites" } });
  if (existing?.value.trim()) {
    console.log(`footer_sites đã có giá trị, không ghi đè:\n${existing.value}`);
    return;
  }
  await prisma.setting.upsert({
    where: { key: "footer_sites" },
    create: { key: "footer_sites", value: VALUE },
    update: { value: VALUE },
  });
  console.log(`+ footer_sites =\n${VALUE}`);
}

main().finally(() => prisma.$disconnect());
