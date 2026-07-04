import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Role, CategoryType, PublishStatus } from "../src/generated/prisma/enums";
import "dotenv/config";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding...");

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@congcudungcu.vn" },
    update: {},
    create: {
      email: "admin@congcudungcu.vn",
      name: "Admin",
      role: Role.ADMIN,
      phone: "0900000000",
    },
  });

  // Categories (PRODUCT)
  const catDungCu = await prisma.category.upsert({
    where: { slug: "dung-cu-cam-tay" },
    update: {},
    create: {
      name: "Dụng cụ cầm tay",
      slug: "dung-cu-cam-tay",
      type: CategoryType.PRODUCT,
      description: "Dụng cụ cầm tay các loại",
    },
  });

  const catMayCu = await prisma.category.upsert({
    where: { slug: "may-cu-gia-cong" },
    update: {},
    create: {
      name: "Máy gia công",
      slug: "may-cu-gia-cong",
      type: CategoryType.PRODUCT,
      description: "Máy gia công công nghiệp",
    },
  });

  // Brand
  const brandBosch = await prisma.brand.upsert({
    where: { slug: "bosch" },
    update: {},
    create: { name: "Bosch", slug: "bosch", country: "Đức" },
  });

  // Product
  const product = await prisma.product.upsert({
    where: { slug: "may-khoan-bosch-gsb-13-re" },
    update: {},
    create: {
      name: "Máy khoan Bosch GSB 13 RE",
      slug: "may-khoan-bosch-gsb-13-re",
      sku: "BOSCH-GSB13RE",
      price: 1290000,
      salePrice: 1190000,
      stock: 50,
      shortDesc: "Máy khoan búa Bosch 600W, khoan gỗ/kim loại/bê tông.",
      description:
        "<p>Máy khoan búa <strong>Bosch GSB 13 RE</strong> công suất 600W, phù hợp gia đình và xưởng nhỏ.</p>",
      specs: { items: [
        { label: "Công suất", value: "600W" },
        { label: "Tốc độ không tải", value: "0-2800 rpm" },
        { label: "Đầu cặp", value: "13mm" },
      ] },
      status: PublishStatus.PUBLISHED,
      featured: true,
      categoryId: catDungCu.id,
      brandId: brandBosch.id,
      publishedAt: new Date(),
      images: {
        create: [
          { url: "https://placehold.co/600x600/png?text=Bosch+GSB+13+RE", alt: "Máy khoan Bosch GSB 13 RE", position: 0 },
        ],
      },
    },
  });

  // Post category
  const catTinTuc = await prisma.category.upsert({
    where: { slug: "tin-tuc" },
    update: {},
    create: {
      name: "Tin tức",
      slug: "tin-tuc",
      type: CategoryType.POST,
    },
  });

  // Post
  await prisma.post.upsert({
    where: { slug: "gioi-thieu-congcudungcu" },
    update: {},
    create: {
      title: "Giới thiệu congcudungcu.vn",
      slug: "gioi-thieu-congcudungcu",
      excerpt: "congcudungcu.vn — nhà phân phối dụng cụ công nghiệp uy tín.",
      content:
        "<p>congcudungcu.vn chuyên cung cấp dụng cụ cầm tay, máy gia công và thiết bị công nghiệp chính hãng.</p>",
      authorId: admin.id,
      categoryId: catTinTuc.id,
      status: PublishStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  // Settings
  await prisma.setting.upsert({
    where: { key: "site.name" },
    update: {},
    create: { key: "site.name", value: "congcudungcu.vn" },
  });
  await prisma.setting.upsert({
    where: { key: "site.hotline" },
    update: {},
    create: { key: "site.hotline", value: "1900 0000" },
  });
  await prisma.setting.upsert({
    where: { key: "site.email" },
    update: {},
    create: { key: "site.email", value: "info@congcudungcu.vn" },
  });

  console.log("Seed done. Admin:", admin.email, "Product:", product.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
