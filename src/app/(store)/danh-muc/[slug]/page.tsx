import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCategorySubtreeIds } from "@/lib/categories";
import { ProductCard } from "@/components/store/product-card";
import { getProductStats } from "@/lib/product-stats";
import { JsonLd, absoluteUrl, breadcrumbJsonLd, pagedPath, toMetaDescription } from "@/lib/seo";
import type { Metadata } from "next";
import { cache } from "react";

export const revalidate = 60;

const PAGE_SIZE = 24;

// Dùng chung giữa generateMetadata và trang (React cache → 1 truy vấn / request)
const getCategory = cache(async (slug: string) =>
  prisma.category.findUnique({
    where: { slug },
    include: {
      parent: { select: { name: true, slug: true, parent: { select: { name: true, slug: true } } } },
      children: { orderBy: { name: "asc" }, select: { id: true, name: true, slug: true, imageUrl: true } },
    },
  }),
);

const countProducts = cache(async (categoryId: string) =>
  prisma.product.count({ where: { status: "PUBLISHED", categoryId: { in: await getCategorySubtreeIds(categoryId) } } }),
);

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = Math.max(1, Number((await searchParams).page || "1") || 1);
  const category = await getCategory(slug);
  if (!category || category.type !== "PRODUCT") return { title: "Không tìm thấy danh mục", robots: { index: false, follow: true } };

  const total = await countProducts(category.id);
  const title = `${category.name} chính hãng, giá tốt${page > 1 ? ` – Trang ${page}` : ""}`;
  const description =
    toMetaDescription(category.description) ||
    toMetaDescription(
      `Mua ${category.name.toLowerCase()} chính hãng tại congcudungcu.vn: ${total} sản phẩm${category.children.length ? ` gồm ${category.children.slice(0, 4).map((c) => c.name.toLowerCase()).join(", ")}` : ""}. Báo giá nhanh, hóa đơn VAT, giao hàng toàn quốc.`,
    );
  const path = pagedPath(`/danh-muc/${category.slug}`, page);
  return {
    title,
    description,
    alternates: { canonical: path },
    // danh mục chưa có sản phẩm: không index (trang mỏng) nhưng vẫn cho đi theo link
    robots: total === 0 ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      url: path,
      title,
      description,
      locale: "vi_VN",
      images: category.imageUrl ? [{ url: absoluteUrl(category.imageUrl), alt: category.name }] : undefined,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const page = Math.max(1, Number((await searchParams).page || "1") || 1);
  const category = await getCategory(slug);

  if (!category || category.type !== "PRODUCT") notFound();

  const ids = await getCategorySubtreeIds(category.id);
  const where = { status: "PUBLISHED" as const, categoryId: { in: ids } };
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { images: { take: 1, orderBy: { position: "asc" } }, brand: { select: { name: true } } },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);
  const stats = await getProductStats(products.map((p) => p.id));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages) notFound();
  const ancestors = [category.parent?.parent, category.parent].filter((c): c is { name: string; slug: string } => !!c);
  const breadcrumb = breadcrumbJsonLd([
    { name: "Trang chủ", path: "/" },
    ...ancestors.map((a) => ({ name: a.name, path: `/danh-muc/${a.slug}` })),
    { name: category.name, path: `/danh-muc/${category.slug}` },
  ]);
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: category.name,
    numberOfItems: total,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: (page - 1) * PAGE_SIZE + index + 1,
      url: absoluteUrl(`/san-pham/${product.slug}`),
      name: product.name,
    })),
  };

  return (
    <div className="bg-[#f5f6f8] pb-8">
      <JsonLd data={[breadcrumb, itemList]} />
      <div className="mx-auto max-w-7xl space-y-4 px-3 pt-3 sm:px-4">
        <nav className="flex flex-wrap items-center gap-1.5 text-[13px] text-[#475569]">
          <Link href="/" className="hover:text-brand">Trang chủ</Link>
          {ancestors.map((a) => (
            <span key={a.slug} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href={`/danh-muc/${a.slug}`} className="hover:text-brand">{a.name}</Link>
            </span>
          ))}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-bold text-[#0f172a]">{category.name}</span>
        </nav>

        <section className="rounded-lg border border-gold bg-white p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h1 className="text-xl font-black text-[#0f172a]">{category.name}</h1>
            <span className="text-xs text-[#475569]">{total} sản phẩm</span>
          </div>
          {category.description && <p className="mb-3 max-w-3xl text-sm leading-6 text-[#334155]">{category.description}</p>}
          {category.children.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {category.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/danh-muc/${child.slug}`}
                  className="rounded-full border border-gold px-3 py-1.5 text-[13px] font-bold text-[#0f172a] transition hover:bg-gold hover:text-brand-dark"
                >
                  {child.name}
                </Link>
              ))}
            </div>
          )}

          {products.length === 0 ? (
            <p className="py-12 text-center text-sm text-[#475569]">Chưa có sản phẩm trong danh mục này.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} stats={stats.get(product.id)} />
              ))}
            </div>
          )}
        </section>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 text-sm font-bold">
            {page > 1 ? (
              <Link href={`?page=${page - 1}`} aria-label="Trang trước" className="grid h-9 w-9 place-items-center rounded-md bg-white text-brand hover:bg-brand-50"><ChevronLeft className="h-4 w-4" /></Link>
            ) : null}
            <span className="rounded-md bg-brand px-3 py-2 text-white">{page} / {totalPages}</span>
            {page < totalPages ? (
              <Link href={`?page=${page + 1}`} aria-label="Trang sau" className="grid h-9 w-9 place-items-center rounded-md bg-white text-brand hover:bg-brand-50"><ChevronRight className="h-4 w-4" /></Link>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
