import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, posts, categories] = await Promise.all([
    prisma.product.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    prisma.post.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ where: { type: "PRODUCT" }, select: { slug: true, updatedAt: true } }),
  ]);

  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, priority: 1.0, changeFrequency: "daily" },
    { url: `${SITE_URL}/san-pham`, lastModified: now, priority: 0.9, changeFrequency: "daily" },
    { url: `${SITE_URL}/tin-tuc`, lastModified: now, priority: 0.7, changeFrequency: "weekly" },
    { url: `${SITE_URL}/lien-he`, lastModified: now, priority: 0.5, changeFrequency: "monthly" },
  ];

  for (const c of categories) {
    entries.push({
      url: `${SITE_URL}/danh-muc/${c.slug}`,
      lastModified: c.updatedAt,
      priority: 0.7,
      changeFrequency: "weekly",
    });
  }
  for (const p of products) {
    entries.push({
      url: `${SITE_URL}/san-pham/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.8,
      changeFrequency: "weekly",
    });
  }
  for (const p of posts) {
    entries.push({
      url: `${SITE_URL}/tin-tuc/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.6,
      changeFrequency: "monthly",
    });
  }

  return entries;
}
