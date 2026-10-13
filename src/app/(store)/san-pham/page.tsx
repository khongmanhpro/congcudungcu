import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Headphones,
  PackageCheck,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buildStandardProductCategories } from "@/components/store/catalog-categories";
import { ProductCard } from "@/components/store/product-card";
import { getProductStats } from "@/lib/product-stats";
import { getCategorySubtreeIds } from "@/lib/categories";
import { pagedPath } from "@/lib/seo";
import type { Metadata } from "next";
import { ProductFilters } from "./product-filters";
import { ProductSortSelect } from "./product-sort-select";

export const revalidate = 60;

type ListingParams = { page?: string; sort?: string; category?: string; brand?: string; minPrice?: string; maxPrice?: string; availability?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<ListingParams> }): Promise<Metadata> {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1") || 1);
  // Trang lọc/sắp xếp: nội dung trùng với danh mục → không index, canonical về danh sách gốc
  const filtered = !!(sp.category || sp.brand || sp.minPrice || sp.maxPrice || sp.availability || (sp.sort && sp.sort !== "newest"));
  const title = `Tất cả sản phẩm dụng cụ & thiết bị công nghiệp${page > 1 ? ` – Trang ${page}` : ""}`;
  const description =
    "Danh sách dụng cụ cầm tay, dụng cụ điện, khí nén, thiết bị đo lường, thiết bị garage chính hãng tại congcudungcu.vn. Giá tốt, hóa đơn VAT, giao hàng toàn quốc.";
  const path = filtered ? "/san-pham" : pagedPath("/san-pham", page);
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: { type: "website", url: path, title, description, locale: "vi_VN" },
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<ListingParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1"));
  const pageSize = 12;
  const sort = sp.sort || "newest";
  const categoryId = sp.category;
  const brandId = sp.brand;
  const minPrice = sp.minPrice ? Number(sp.minPrice) : undefined;
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined;
  const availability = sp.availability;

  const where: Record<string, unknown> = { status: "PUBLISHED" };
  if (categoryId) where.categoryId = { in: await getCategorySubtreeIds(categoryId).catch(() => [categoryId]) };
  if (brandId) where.brandId = brandId;
  if (availability === "in-stock") where.stock = { gt: 0 };
  if (availability === "out-of-stock") where.stock = { lte: 0 };
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.OR = [
      { salePrice: { gte: minPrice, lte: maxPrice } },
      { salePrice: null, price: { gte: minPrice, lte: maxPrice } },
    ];
  }

  const orderBy: Record<string, unknown> =
    sort === "price-asc" ? { price: "asc" } :
    sort === "price-desc" ? { price: "desc" } :
    { createdAt: "desc" };

  const [products, total, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { images: { take: 1, orderBy: { position: "asc" } }, category: true, brand: true },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }).catch(() => []),
    prisma.product.count({ where }).catch(() => 0),
    prisma.category.findMany({
      where: { type: "PRODUCT", parentId: null },
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
      take: 40,
    }).catch(() => []),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
      take: 20,
    }).catch(() => []),
  ]);

  const stats = await getProductStats(products.map((p) => p.id));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, total);
  const qs = new URLSearchParams();
  if (sort !== "newest") qs.set("sort", sort);
  if (categoryId) qs.set("category", categoryId);
  if (brandId) qs.set("brand", brandId);
  if (minPrice) qs.set("minPrice", String(minPrice));
  if (maxPrice) qs.set("maxPrice", String(maxPrice));
  if (availability) qs.set("availability", availability);

  const categoryCounts = new Map(categories.map((category) => [category.id, category._count.products]));
  const filterCategories = buildStandardProductCategories(categories).map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    count: categoryCounts.get(category.id) ?? 0,
  }));

  return (
    <div className="bg-[#f4f7fb] text-[#172033]">
      <section className="border-b border-[#dce5f1] bg-[linear-gradient(90deg,#f7fbff_0%,#eef6ff_48%,#f8fbff_100%)]">
        <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
          <nav className="mb-4 flex items-center gap-2 text-sm text-[#667085]">
            <Link href="/" className="hover:text-brand">Trang chủ</Link>
            <ChevronRight className="h-4 w-4" />
            <span>Sản phẩm</span>
          </nav>
          <div className="grid gap-5 lg:grid-cols-[1fr_560px]">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-brand-dark sm:text-4xl">Sản phẩm</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#344054] sm:mt-4">
                Cung cấp hơn 10.000+ sản phẩm dụng cụ, thiết bị chính hãng từ các thương hiệu hàng đầu thế giới.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {[
                { icon: ShieldCheck, title: "100% chính hãng", desc: "Cam kết chất lượng" },
                { icon: Users, title: "Giá tốt nhất", desc: "Cạnh tranh thị trường" },
                { icon: Truck, title: "Giao hàng nhanh", desc: "Toàn quốc" },
                { icon: Headphones, title: "Hỗ trợ 24/7", desc: "Tận tâm, chuyên nghiệp" },
              ].map((item) => (
                <div key={item.title} className="text-center">
                  <item.icon className="mx-auto h-7 w-7 text-brand sm:h-9 sm:w-9" />
                  <div className="mt-2 text-xs font-black uppercase text-brand">{item.title}</div>
                  <div className="mt-1 text-xs text-[#667085]">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-5 px-3 py-5 sm:px-4 sm:py-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6">
        <details className="rounded-md border border-[#dce5f1] bg-white shadow-sm lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-black uppercase text-brand">
            <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Bộ lọc sản phẩm</span>
            <ChevronRight className="h-4 w-4" />
          </summary>
          <div className="border-t border-[#edf1f7] p-3">
            <ProductFilters
              categories={filterCategories}
              brands={brands.map((brand) => ({ id: brand.id, name: brand.name, slug: brand.slug, count: brand._count.products }))}
              current={{ category: categoryId, brand: brandId, minPrice, maxPrice, sort, availability }}
            />
          </div>
        </details>

        <aside className="hidden space-y-5 lg:block">
          <ProductFilters
            categories={filterCategories}
            brands={brands.map((brand) => ({ id: brand.id, name: brand.name, slug: brand.slug, count: brand._count.products }))}
            current={{ category: categoryId, brand: brandId, minPrice, maxPrice, sort, availability }}
          />
        </aside>

        <main className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 rounded-md border border-[#dce5f1] bg-white p-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:border-0 sm:bg-transparent sm:p-0">
            <p className="text-sm text-[#667085]">Hiển thị {firstItem}-{lastItem} của {total} kết quả</p>
            <div className="flex items-center gap-2 sm:gap-3">
              {categoryId && <input type="hidden" name="category" value={categoryId} />}
              {brandId && <input type="hidden" name="brand" value={brandId} />}
              {minPrice && <input type="hidden" name="minPrice" value={minPrice} />}
              {maxPrice && <input type="hidden" name="maxPrice" value={maxPrice} />}
              {availability && <input type="hidden" name="availability" value={availability} />}
              <label htmlFor="sort" className="shrink-0 text-sm text-[#344054]">Sắp xếp:</label>
              <ProductSortSelect value={sort} />
            </div>
          </div>

          {products.length === 0 ? (
            <div className="rounded-md border border-[#dce5f1] bg-white py-16 text-center text-sm text-[#667085]">
              Không có sản phẩm nào phù hợp.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} stats={stats.get(product.id)} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <PageLink page={Math.max(1, page - 1)} qs={qs} disabled={page === 1} ariaLabel="Trang trước">
                <ChevronLeft className="h-4 w-4" />
              </PageLink>
              {Array.from({ length: Math.min(3, totalPages) }, (_, index) => index + 1).map((pageNumber) => (
                <PageLink key={pageNumber} page={pageNumber} qs={qs} active={pageNumber === page}>
                  {pageNumber}
                </PageLink>
              ))}
              {totalPages > 4 && <span className="px-2 text-sm text-[#667085]">...</span>}
              {totalPages > 3 && (
                <PageLink page={totalPages} qs={qs} active={page === totalPages}>
                  {totalPages}
                </PageLink>
              )}
              <PageLink page={Math.min(totalPages, page + 1)} qs={qs} disabled={page === totalPages} ariaLabel="Trang sau">
                <ChevronRight className="h-4 w-4" />
              </PageLink>
            </div>
          )}
        </main>
      </div>

      <section className="border-t border-[#dce5f1] bg-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-7 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShieldCheck, title: "Cam kết chính hãng", desc: "100% sản phẩm chính hãng" },
            { icon: Users, title: "Giá cả cạnh tranh", desc: "Giá tốt nhất thị trường" },
            { icon: Truck, title: "Giao hàng toàn quốc", desc: "Nhanh chóng, an toàn" },
            { icon: PackageCheck, title: "Đổi trả dễ dàng", desc: "Trong vòng 7 ngày" },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-4">
              <item.icon className="h-8 w-8 text-brand" />
              <div>
                <div className="text-sm font-black uppercase text-brand">{item.title}</div>
                <div className="text-xs text-[#667085]">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PageLink({
  page,
  qs,
  active,
  disabled,
  ariaLabel,
  children,
}: {
  page: number;
  qs: URLSearchParams;
  active?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  const nextQs = new URLSearchParams(qs);
  nextQs.set("page", String(page));

  if (disabled) {
    return (
      <span className="grid h-9 min-w-9 place-items-center rounded-md bg-[#f1f5f9] px-2 text-sm text-[#98a2b3]">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={`/san-pham?${nextQs.toString()}`}
      aria-label={ariaLabel}
      className={`grid h-9 min-w-9 place-items-center rounded-md px-2 text-sm font-bold transition ${active ? "bg-brand text-white" : "bg-white text-brand hover:bg-brand-50"}`}
    >
      {children}
    </Link>
  );
}
