import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCategorySubtreeIds } from "@/lib/categories";
import { getProductStats } from "@/lib/product-stats";
import { JsonLd, absoluteUrl, breadcrumbJsonLd, pagedPath, toMetaDescription } from "@/lib/seo";
import { BRAND_CATEGORY_MIN, brandPath, categoryPath, productPath } from "@/lib/urls";
import { ProductCard } from "@/components/store/product-card";
import { Pagination } from "@/components/store/pagination";

export const revalidate = 60;

const PAGE_SIZE = 24;

type Params = { params: Promise<{ path: string[] }>; searchParams: Promise<{ page?: string }> };

/** /thuong-hieu/<hãng> hoặc /thuong-hieu/<hãng>/<danh-mục> */
const resolve = cache(async (segments: string[]) => {
  if (segments.length < 1 || segments.length > 2) return null;
  const brand = await prisma.brand.findUnique({ where: { slug: segments[0] } });
  if (!brand) return null;
  const category = segments[1]
    ? await prisma.category.findUnique({ where: { slug: segments[1] }, select: { id: true, name: true, slug: true, type: true, parent: { select: { slug: true, name: true } } } })
    : null;
  if (segments[1] && (!category || category.type !== "PRODUCT")) return null;
  const where = {
    status: "PUBLISHED" as const,
    brandId: brand.id,
    ...(category ? { categoryId: { in: await getCategorySubtreeIds(category.id) } } : {}),
  };
  const total = await prisma.product.count({ where });
  return { brand, category, where, total };
});

function titleFor(brandName: string, categoryName?: string) {
  return categoryName ? `${categoryName} ${brandName} chính hãng` : `${brandName} chính hãng – dụng cụ & thiết bị`;
}

export async function generateMetadata({ params, searchParams }: Params): Promise<Metadata> {
  const data = await resolve((await params).path);
  if (!data) return { title: "Không tìm thấy thương hiệu", robots: { index: false, follow: true } };
  const { brand, category, total } = data;
  const page = Math.max(1, Number((await searchParams).page || "1") || 1);
  const title = `${category ? titleFor(brand.name, category.name) : brand.seoTitle || titleFor(brand.name)}${page > 1 ? ` – Trang ${page}` : ""}`;
  const description =
    (!category && toMetaDescription(brand.seoDesc || brand.description)) ||
    toMetaDescription(
      `${total} sản phẩm ${category ? `${category.name.toLowerCase()} ` : ""}${brand.name}${brand.country ? ` (${brand.country})` : ""} chính hãng tại congcudungcu.vn. Báo giá nhanh, hóa đơn VAT, giao hàng toàn quốc.`,
    );
  const canonical = pagedPath(brandPath(brand.slug, category?.slug), page);
  return {
    title,
    description,
    alternates: { canonical },
    // hãng × danh mục quá ít sản phẩm = trang mỏng → không index
    robots: total === 0 || (category && total < BRAND_CATEGORY_MIN) ? { index: false, follow: true } : undefined,
    openGraph: { type: "website", url: canonical, title, description, locale: "vi_VN", images: brand.logoUrl ? [absoluteUrl(brand.logoUrl)] : undefined },
  };
}

export default async function BrandPage({ params, searchParams }: Params) {
  const data = await resolve((await params).path);
  if (!data || data.total === 0) notFound();
  const { brand, category, where, total } = data;
  const page = Math.max(1, Number((await searchParams).page || "1") || 1);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages) notFound();

  const [products, categoryRows] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { images: { take: 1, orderBy: { position: "asc" } }, brand: { select: { name: true } } },
      orderBy: [{ featured: "desc" }, { publishedAt: { sort: "desc", nulls: "last" } }, { id: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    // danh mục của hãng (chỉ ở trang hãng tổng)
    category ? Promise.resolve([]) : prisma.product.groupBy({ by: ["categoryId"], where, _count: { _all: true } }),
  ]);
  const stats = await getProductStats(products.map((p) => p.id));
  const categories = categoryRows.length
    ? await prisma.category.findMany({
        where: { id: { in: categoryRows.map((r) => r.categoryId!).filter(Boolean) } },
        select: { id: true, name: true, slug: true, parent: { select: { slug: true } } },
      })
    : [];
  const countByCategory = new Map(categoryRows.map((r) => [r.categoryId, r._count._all]));
  const brandCategories = categories.map((c) => ({ ...c, count: countByCategory.get(c.id) ?? 0 })).sort((a, b) => b.count - a.count);

  const path = brandPath(brand.slug, category?.slug);
  const heading = category ? `${category.name} ${brand.name}` : `Thương hiệu ${brand.name}`;
  const crumbs = [
    { name: "Trang chủ", path: "/" },
    { name: "Thương hiệu", path: "/thuong-hieu" },
    { name: brand.name, path: brandPath(brand.slug) },
    ...(category ? [{ name: category.name, path }] : []),
  ];

  return (
    <div className="bg-[#f5f6f8] pb-8">
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: heading,
            url: absoluteUrl(pagedPath(path, page)),
            about: { "@type": "Brand", name: brand.name, logo: brand.logoUrl ? absoluteUrl(brand.logoUrl) : undefined },
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: total,
              itemListElement: products.map((p, i) => ({ "@type": "ListItem", position: (page - 1) * PAGE_SIZE + i + 1, url: absoluteUrl(productPath(p.slug)), name: p.name })),
            },
          },
        ]}
      />
      <div className="mx-auto max-w-7xl space-y-4 px-3 pt-3 sm:px-4">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[13px] text-[#475569]">
          {crumbs.slice(0, -1).map((c) => (
            <span key={c.path} className="flex items-center gap-1.5">
              <Link href={c.path} className="hover:text-brand">{c.name}</Link>
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          ))}
          <span className="font-bold text-[#0f172a]">{crumbs[crumbs.length - 1].name}</span>
        </nav>

        <section className="rounded-lg border border-gold bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h1 className="text-xl font-black text-[#0f172a] sm:text-2xl">{heading}</h1>
            <span className="shrink-0 text-xs text-[#475569]">{total} sản phẩm</span>
          </div>
          {page === 1 && (
            <p className="mb-3 max-w-4xl text-sm leading-6 text-[#334155]">
              {!category && brand.description
                ? brand.description
                : `congcudungcu.vn phân phối ${total} sản phẩm ${category ? category.name.toLowerCase() + " " : ""}${brand.name} chính hãng${brand.country ? `, thương hiệu ${brand.country}` : ""}. Có hóa đơn VAT, giao hàng toàn quốc, báo giá nhanh cho đại lý và dự án.`}
            </p>
          )}
          {category && (
            <p className="mb-3 text-[13px]">
              <Link href={categoryPath(category)} className="font-bold text-brand hover:underline">Xem tất cả {category.name.toLowerCase()} các hãng →</Link>
            </p>
          )}
          {brandCategories.length > 1 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {brandCategories.map((c) => (
                <Link
                  key={c.id}
                  href={c.count >= BRAND_CATEGORY_MIN ? brandPath(brand.slug, c.slug) : categoryPath(c)}
                  className="rounded-full border border-gold px-3 py-1.5 text-[13px] font-bold text-[#0f172a] transition hover:bg-gold hover:text-brand-dark"
                >
                  {c.name} {brand.name} <span className="font-normal text-[#64748b]">({c.count})</span>
                </Link>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} stats={stats.get(product.id)} />
            ))}
          </div>
        </section>

        <Pagination path={path} page={page} totalPages={totalPages} />

        {page === 1 && !category && brand.content && (
          <section className="rounded-lg border border-gold bg-white p-4">
            <div className="rich-content max-w-4xl" dangerouslySetInnerHTML={{ __html: brand.content }} />
          </section>
        )}
      </div>
    </div>
  );
}
