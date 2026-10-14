import { prisma } from "@/lib/prisma";
import { absoluteUrl, toMetaDescription } from "@/lib/seo";
import { categoryPath, productPath } from "@/lib/urls";

/** Dữ liệu catalog dùng chung cho llms.txt / llms-full.txt / feed Merchant. */
export async function getCatalogForExport() {
  const [categories, products, brands] = await Promise.all([
    prisma.category.findMany({
      where: { type: "PRODUCT" },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, intro: true, parentId: true, parent: { select: { slug: true, name: true } } },
    }),
    prisma.product.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ featured: "desc" }, { publishedAt: { sort: "desc", nulls: "last" } }, { id: "asc" }],
      select: {
        id: true, name: true, slug: true, sku: true, model: true, gtin: true, price: true, salePrice: true, stock: true,
        shortDesc: true, seoTitle: true, seoDesc: true, description: true, categoryId: true, updatedAt: true,
        brand: { select: { name: true } },
        images: { orderBy: { position: "asc" }, take: 5, select: { url: true } },
      },
    }),
    prisma.brand.findMany({ select: { name: true, slug: true, country: true, _count: { select: { products: { where: { status: "PUBLISHED" } } } } } }),
  ]);
  return { categories, products, brands: brands.filter((b) => b._count.products > 0).sort((a, b) => b._count.products - a._count.products) };
}

export type ExportProduct = Awaited<ReturnType<typeof getCatalogForExport>>["products"][number];

export const productUrl = (p: { slug: string }) => absoluteUrl(productPath(p.slug));
export const categoryUrl = (c: { slug: string; parent?: { slug: string } | null }) => absoluteUrl(categoryPath(c));

export function effectivePrice(p: { price: number; salePrice: number | null }) {
  return p.salePrice && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;
}

/** Tên hiển thị cho AI/feed: ưu tiên seoTitle (ngắn gọn, thương hiệu + mã ở đầu) — khớp <h1>/JSON-LD trên trang sản phẩm. */
export function productTitle(p: ExportProduct) {
  return p.seoTitle || p.name;
}

export function productSummary(p: ExportProduct, max = 300) {
  return toMetaDescription(p.seoDesc) || toMetaDescription(p.shortDesc, max) || toMetaDescription(p.description, max) || "";
}
