import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { POLICIES } from "@/lib/policies";
import { absoluteUrl } from "@/lib/seo";
import { BRAND_CATEGORY_MIN, brandPath, categoryPath, postPath, productPath } from "@/lib/urls";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

// ~3.300 URL — 1 file là đủ (giới hạn 50.000 URL/file).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const published = { status: "PUBLISHED" as const };
  const [products, posts, categories, brands, brandCategory] = await Promise.all([
    prisma.product.findMany({
      where: published,
      select: { slug: true, updatedAt: true, contentUpdatedAt: true, images: { select: { url: true }, orderBy: { position: "asc" }, take: 5 } },
    }),
    prisma.post.findMany({ where: published, select: { slug: true, updatedAt: true, coverImage: true } }),
    prisma.category.findMany({
      where: { type: "PRODUCT" },
      select: { id: true, slug: true, updatedAt: true, imageUrl: true, parentId: true, parent: { select: { slug: true } } },
    }),
    prisma.brand.findMany({ select: { id: true, slug: true, logoUrl: true } }),
    prisma.product.groupBy({ by: ["brandId", "categoryId"], where: { ...published, brandId: { not: null }, categoryId: { not: null } }, _count: { _all: true } }),
  ]);

  // Số sản phẩm theo danh mục (cộng dồn lên cha) và theo hãng × danh mục
  const byId = new Map(categories.map((c) => [c.id, c]));
  const categoryCount = new Map<string, number>();
  const brandCatCount = new Map<string, number>(); // `${brandId}|${categoryId}`
  const brandCount = new Map<string, number>();
  for (const row of brandCategory) {
    const n = row._count._all;
    brandCount.set(row.brandId!, (brandCount.get(row.brandId!) ?? 0) + n);
    for (let cat = byId.get(row.categoryId!); cat; cat = cat.parentId ? byId.get(cat.parentId) : undefined) {
      categoryCount.set(cat.id, (categoryCount.get(cat.id) ?? 0) + n);
      const key = `${row.brandId}|${cat.id}`;
      brandCatCount.set(key, (brandCatCount.get(key) ?? 0) + n);
    }
  }

  const latest = products.reduce((max, p) => (p.updatedAt > max ? p.updatedAt : max), new Date(0));
  const lastModified = latest.getTime() > 0 ? latest : new Date();
  const brandSlug = new Map(brands.map((b) => [b.id, b.slug]));

  return [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/san-pham"), lastModified, changeFrequency: "daily", priority: 0.7 },
    { url: absoluteUrl("/thuong-hieu"), lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/kien-thuc"), lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/cua-hang"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/lien-he"), changeFrequency: "yearly", priority: 0.5 },
    ...Object.keys(POLICIES).map((slug) => ({ url: absoluteUrl(`/${slug}`), changeFrequency: "yearly" as const, priority: 0.3 })),
    // danh mục có sản phẩm (tránh trang mỏng)
    ...categories
      .filter((c) => (categoryCount.get(c.id) ?? 0) > 0)
      .map((c) => ({
        url: absoluteUrl(categoryPath(c)),
        lastModified: c.updatedAt,
        changeFrequency: "weekly" as const,
        priority: c.parentId ? 0.8 : 0.9,
        images: c.imageUrl ? [absoluteUrl(c.imageUrl)] : undefined,
      })),
    ...brands
      .filter((b) => (brandCount.get(b.id) ?? 0) > 0)
      .map((b) => ({ url: absoluteUrl(brandPath(b.slug)), changeFrequency: "weekly" as const, priority: 0.8, images: b.logoUrl ? [absoluteUrl(b.logoUrl)] : undefined })),
    // hãng × danh mục đủ lớn (từ khoá "kìm knipex", "cờ lê toptul"…)
    ...[...brandCatCount]
      .filter(([, n]) => n >= BRAND_CATEGORY_MIN)
      .map(([key]) => {
        const [brandId, categoryId] = key.split("|");
        return { url: absoluteUrl(brandPath(brandSlug.get(brandId)!, byId.get(categoryId)!.slug)), changeFrequency: "weekly" as const, priority: 0.7 };
      }),
    ...products.map((p) => ({
      url: absoluteUrl(productPath(p.slug)),
      lastModified: p.contentUpdatedAt && p.contentUpdatedAt > p.updatedAt ? p.contentUpdatedAt : p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
      images: p.images.length ? p.images.map((img) => absoluteUrl(img.url)) : undefined,
    })),
    ...posts.map((p) => ({
      url: absoluteUrl(postPath(p.slug)),
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      images: p.coverImage ? [absoluteUrl(p.coverImage)] : undefined,
    })),
  ];
}
