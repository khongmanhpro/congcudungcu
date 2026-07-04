/**
 * Tạo admin user đầu tiên.
 * Cách dùng: pnpm exec tsx scripts/create-admin.ts admin@congcudungcu.vn password123
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";
import { Role } from "../src/generated/prisma/enums";

async function main() {
  const email = process.argv[2] ?? "admin@congcudungcu.vn";
  const password = process.argv[3] ?? "admin123";
  const name = process.argv[4] ?? "Administrator";

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: Role.ADMIN },
    create: { email, name, passwordHash, role: Role.ADMIN },
  });

  console.log("Admin user ready:");
  console.log("  email:", user.email);
  console.log("  password:", password);
  console.log("  role:", user.role);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
