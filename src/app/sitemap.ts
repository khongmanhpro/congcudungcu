import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";
import { categoryPath } from "@/lib/urls";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const POLICY_PAGES = [
  "chinh-sach-ban-hang",
  "phuong-thuc-thanh-toan",
  "chinh-sach-bao-mat",
  "chinh-sach-doi-tra",
  "chinh-sach-bao-hanh",
  "van-chuyen",
  "tro-thanh-dai-ly",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, posts, categories] = await Promise.all([
    prisma.product.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true, images: { select: { url: true }, orderBy: { position: "asc" }, take: 5 } },
    }),
    prisma.post.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true, coverImage: true } }),
    // chỉ danh mục có sản phẩm (trực tiếp hoặc ở danh mục con) — tránh trang mỏng
    prisma.category.findMany({
      where: {
        type: "PRODUCT",
        OR: [
          { products: { some: { status: "PUBLISHED" } } },
          { children: { some: { products: { some: { status: "PUBLISHED" } } } } },
          { children: { some: { children: { some: { products: { some: { status: "PUBLISHED" } } } } } } },
        ],
      },
      select: { slug: true, updatedAt: true, imageUrl: true, parent: { select: { slug: true } } },
    }),
  ]);

  const latest = [...products, ...posts].reduce((max, item) => (item.updatedAt > max ? item.updatedAt : max), new Date(0));
  const lastModified = latest.getTime() > 0 ? latest : new Date();

  return [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/san-pham"), lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/kien-thuc"), lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/lien-he"), changeFrequency: "yearly", priority: 0.5 },
    ...POLICY_PAGES.map((slug) => ({ url: absoluteUrl(`/${slug}`), changeFrequency: "yearly" as const, priority: 0.3 })),
    ...categories.map((c) => ({
      url: absoluteUrl(categoryPath(c)),
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: c.imageUrl ? [absoluteUrl(c.imageUrl)] : undefined,
    })),
    ...products.map((p) => ({
      url: absoluteUrl(`/san-pham/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: p.images.length ? p.images.map((img) => absoluteUrl(img.url)) : undefined,
    })),
    ...posts.map((p) => ({
      url: absoluteUrl(`/kien-thuc/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      images: p.coverImage ? [absoluteUrl(p.coverImage)] : undefined,
    })),
  ];
}
