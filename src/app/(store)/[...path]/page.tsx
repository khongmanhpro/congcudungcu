import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCategorySubtreeIds } from "@/lib/categories";
import { getProductStats } from "@/lib/product-stats";
import { POLICIES, getPolicyContent } from "@/lib/policies";
import { redirectIfMoved } from "@/lib/redirects";
import { JsonLd, absoluteUrl, breadcrumbJsonLd, pagedPath, toMetaDescription } from "@/lib/seo";
import { BRAND_CATEGORY_MIN, brandPath, categoryPath, postPath, productPath } from "@/lib/urls";
import { ProductCard } from "@/components/store/product-card";
import { FaqSection, faqJsonLd, parseFaq } from "@/components/store/faq-section";
import { Pagination } from "@/components/store/pagination";

export const revalidate = 60;

const PAGE_SIZE = 24;

type Params = { params: Promise<{ path: string[] }>; searchParams: Promise<{ page?: string }> };

/** Danh mục theo đường dẫn: tìm theo slug cuối, kiểm tra cha khớp. */
const getCategoryBySegments = cache(async (segments: string[]) => {
  if (segments.length === 0 || segments.length > 2) return null;
  const category = await prisma.category.findUnique({
    where: { slug: segments[segments.length - 1] },
    include: {
      parent: { select: { name: true, slug: true } },
      children: { orderBy: [{ position: "asc" }, { name: "asc" }], select: { id: true, name: true, slug: true } },
    },
  });
  if (!category || category.type !== "PRODUCT") return null;
  return category;
});

const countProducts = cache(async (categoryId: string) =>
  prisma.product.count({ where: { status: "PUBLISHED", categoryId: { in: await getCategorySubtreeIds(categoryId) } } }),
);

function defaultCategoryDescription(name: string, total: number, children: { name: string }[]) {
  const sub = children.length ? ` gồm ${children.slice(0, 4).map((c) => c.name.toLowerCase()).join(", ")}` : "";
  return `Mua ${name.toLowerCase()} chính hãng tại congcudungcu.vn: ${total} sản phẩm${sub}. Báo giá nhanh, hóa đơn VAT, giao hàng toàn quốc.`;
}

export async function generateMetadata({ params, searchParams }: Params): Promise<Metadata> {
  const { path } = await params;
  const policy = path.length === 1 ? POLICIES[path[0]] : undefined;
  if (policy) {
    const description = toMetaDescription(await getPolicyContent(policy));
    return {
      title: policy.title,
      description,
      alternates: { canonical: `/${path[0]}` },
      openGraph: { type: "website", url: `/${path[0]}`, title: policy.title, description, locale: "vi_VN" },
    };
  }

  const category = await getCategoryBySegments(path);
  if (!category) return { title: "Không tìm thấy trang", robots: { index: false, follow: true } };
  const page = Math.max(1, Number((await searchParams).page || "1") || 1);
  const total = await countProducts(category.id);
  const title = `${category.seoTitle || `${category.name} chính hãng, giá tốt`}${page > 1 ? ` – Trang ${page}` : ""}`;
  const description =
    toMetaDescription(category.seoDesc) ||
    toMetaDescription(category.intro) ||
    toMetaDescription(defaultCategoryDescription(category.name, total, category.children));
  const canonical = pagedPath(categoryPath(category), page);
  return {
    title,
    description,
    alternates: { canonical },
    robots: total === 0 ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      locale: "vi_VN",
      images: category.imageUrl ? [{ url: absoluteUrl(category.imageUrl), alt: category.name }] : undefined,
    },
  };
}

export default async function CatchAllPage({ params, searchParams }: Params) {
  const { path } = await params;
  const pathname = `/${path.join("/")}`;

  const policy = path.length === 1 ? POLICIES[path[0]] : undefined;
  if (policy) return <PolicyView title={policy.title} content={await getPolicyContent(policy)} />;

  const category = await getCategoryBySegments(path);
  if (!category) {
    await redirectIfMoved(pathname);
    notFound();
  }
  // đường dẫn đúng slug nhưng sai cấp (vd /co-le-vong-mieng) → chuyển về URL chuẩn
  const canonicalPath = categoryPath(category);
  if (canonicalPath !== pathname) permanentRedirect(canonicalPath);

  const page = Math.max(1, Number((await searchParams).page || "1") || 1);
  return <CategoryView category={category} page={page} />;
}

function PolicyView({ title, content }: { title: string; content: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-4 text-sm text-[#475569]">
        <Link href="/" className="hover:text-brand">Trang chủ</Link> / <span>{title}</span>
      </nav>
      <h1 className="mb-6 text-2xl font-bold">{title}</h1>
      <div className="max-w-none whitespace-pre-line text-[15px] leading-7 text-[#334155]">{content}</div>
    </div>
  );
}

/**
 * Phần dữ liệu tốn kém (join ảnh/hãng, 2 groupBy, tìm bài liên quan) — cache theo categoryId+page
 * vì route này đọc searchParams (phân trang) nên luôn SSR động, revalidate ở page-level không áp
 * dụng được; cache ở tầng dữ liệu để giảm TTFB thay vì cache ở tầng HTTP.
 */
function getCategoryPageData(categoryId: string, page: number, categoryName: string, path: string) {
  return unstable_cache(
    async () => {
      const ids = await getCategorySubtreeIds(categoryId);
      const where = { status: "PUBLISHED" as const, categoryId: { in: ids } };
      const [products, total, brandRows, childCounts] = await Promise.all([
        prisma.product.findMany({
          where,
          include: { images: { take: 1, orderBy: { position: "asc" } }, brand: { select: { name: true } } },
          // id làm khoá phụ → thứ tự ổn định giữa các trang
          orderBy: [{ featured: "desc" }, { publishedAt: { sort: "desc", nulls: "last" } }, { id: "asc" }],
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
        countProducts(categoryId),
        prisma.product.groupBy({ by: ["brandId"], where: { ...where, brandId: { not: null } }, _count: { _all: true } }),
        prisma.product.groupBy({ by: ["categoryId"], where, _count: { _all: true } }),
      ]);
      const stats = await getProductStats(products.map((p) => p.id));
      const brands = await prisma.brand.findMany({
        where: { id: { in: brandRows.map((r) => r.brandId!) } },
        select: { id: true, name: true, slug: true },
      });
      // bài kiến thức có link tới (hoặc nhắc tên) danh mục này → liên kết hai chiều danh mục ↔ bài viết
      const guides = await prisma.post
        .findMany({
          where: {
            status: "PUBLISHED",
            OR: [{ content: { contains: `href="${path}"` } }, { content: { contains: categoryName, mode: "insensitive" } }],
          },
          orderBy: { publishedAt: "desc" },
          take: 4,
          select: { id: true, slug: true, title: true, excerpt: true },
        })
        .catch(() => []);
      return { products, total, brandRows, childCounts, stats: [...stats], brands, guides };
    },
    [`category-data-${categoryId}-${page}`],
    { revalidate: 60, tags: [`category-${categoryId}`] },
  )();
}

async function CategoryView({ category, page }: { category: NonNullable<Awaited<ReturnType<typeof getCategoryBySegments>>>; page: number }) {
  const path = categoryPath(category);
  const { products, total, brandRows, childCounts, stats: statsEntries, brands, guides } = await getCategoryPageData(category.id, page, category.name, path);
  const stats = new Map(statsEntries);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages) notFound();

  const brandCount = new Map(brandRows.map((r) => [r.brandId, r._count._all]));
  const brandFacets = brands
    .map((b) => ({ ...b, count: brandCount.get(b.id) ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 16);
  const childCount = new Map(childCounts.map((r) => [r.categoryId, r._count._all]));
  const faq = parseFaq(category.faq);
  const intro = category.intro || defaultCategoryDescription(category.name, total, category.children);

  const breadcrumb = breadcrumbJsonLd([
    { name: "Trang chủ", path: "/" },
    ...(category.parent ? [{ name: category.parent.name, path: categoryPath({ slug: category.parent.slug }) }] : []),
    { name: category.name, path },
  ]);
  const collection = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    url: absoluteUrl(pagedPath(path, page)),
    description: toMetaDescription(intro),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: total,
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: (page - 1) * PAGE_SIZE + index + 1,
        url: absoluteUrl(productPath(product.slug)),
        name: product.seoTitle || product.name,
      })),
    },
  };

  return (
    <div className="bg-[#f5f6f8] pb-8">
      <JsonLd data={[breadcrumb, collection, ...(faq.length ? [faqJsonLd(faq)] : [])]} />
      <div className="mx-auto max-w-7xl space-y-4 px-3 pt-3 sm:px-4">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[13px] text-[#475569]">
          <Link href="/" className="hover:text-brand">Trang chủ</Link>
          {category.parent && (
            <span className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href={categoryPath({ slug: category.parent.slug })} className="hover:text-brand">{category.parent.name}</Link>
            </span>
          )}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-bold text-[#0f172a]">{category.name}</span>
        </nav>

        <section className="rounded-lg border border-gold bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h1 className="text-xl font-black text-[#0f172a] sm:text-2xl">{category.name}</h1>
            <span className="shrink-0 text-xs text-[#475569]">{total} sản phẩm</span>
          </div>
          {page === 1 && <p className="mb-3 max-w-4xl text-sm leading-6 text-[#334155]">{intro}</p>}

          {category.children.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {category.children.map((child) => (
                <Link
                  key={child.id}
                  href={categoryPath({ slug: child.slug, parent: { slug: category.slug } })}
                  className="rounded-full border border-gold px-3 py-1.5 text-[13px] font-bold text-[#0f172a] transition hover:bg-gold hover:text-brand-dark"
                >
                  {child.name} <span className="font-normal text-[#64748b]">({childCount.get(child.id) ?? 0})</span>
                </Link>
              ))}
            </div>
          )}

          {brandFacets.length > 1 && (
            <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[13px]">
              <span className="mr-1 font-bold text-[#475569]">Thương hiệu:</span>
              {brandFacets.map((brand) => (
                <Link
                  key={brand.id}
                  href={brand.count >= BRAND_CATEGORY_MIN ? brandPath(brand.slug, category.slug) : brandPath(brand.slug)}
                  className="rounded border border-[#e2e8f0] px-2 py-1 font-medium text-[#0f172a] hover:border-gold hover:text-brand"
                >
                  {category.name} {brand.name} <span className="text-[#64748b]">({brand.count})</span>
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

        <Pagination path={path} page={page} totalPages={totalPages} />

        {page === 1 && category.content && (
          <section className="rounded-lg border border-gold bg-white p-4">
            <div className="rich-content max-w-4xl" dangerouslySetInnerHTML={{ __html: category.content }} />
          </section>
        )}
        {page === 1 && guides.length > 0 && (
          <section className="rounded-lg border border-gold bg-white p-4">
            <h2 className="mb-3 text-lg font-black text-[#0f172a]">Bài viết hướng dẫn</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {guides.map((g) => (
                <Link key={g.id} href={postPath(g.slug)} className="rounded-md border border-[#e2e8f0] p-3 transition hover:border-gold hover:shadow-sm">
                  <h3 className="text-[15px] font-bold text-[#0f172a]">{g.title}</h3>
                  {g.excerpt && <p className="mt-1 line-clamp-2 text-[13px] text-[#475569]">{g.excerpt}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}
        {page === 1 && <FaqSection items={faq} title={`Câu hỏi thường gặp về ${category.name.toLowerCase()}`} />}
      </div>
    </div>
  );
}
