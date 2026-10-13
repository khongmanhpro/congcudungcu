import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCategorySubtreeIds } from "@/lib/categories";
import { ProductCard } from "@/components/store/product-card";

export const revalidate = 60;

const PAGE_SIZE = 24;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const page = Math.max(1, Number((await searchParams).page || "1") || 1);
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      parent: { select: { name: true, slug: true, parent: { select: { name: true, slug: true } } } },
      children: { orderBy: { name: "asc" }, select: { id: true, name: true, slug: true, imageUrl: true } },
    },
  });

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
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const ancestors = [category.parent?.parent, category.parent].filter((c): c is { name: string; slug: string } => !!c);

  return (
    <div className="bg-[#f3f5f9] pb-10">
      <div className="border-b border-[#dce5f1] bg-white">
        <div className="mx-auto max-w-7xl px-3 py-5 sm:px-4">
          <nav className="mb-2 flex flex-wrap items-center gap-1.5 text-[13px] text-[#667085]">
            <Link href="/" className="hover:text-brand">Trang chủ</Link>
            {ancestors.map((a) => (
              <span key={a.slug} className="flex items-center gap-1.5">
                <ChevronRight className="h-3.5 w-3.5" />
                <Link href={`/danh-muc/${a.slug}`} className="hover:text-brand">{a.name}</Link>
              </span>
            ))}
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-semibold text-brand">{category.name}</span>
          </nav>
          <h1 className="text-2xl font-bold uppercase text-brand">{category.name}</h1>
          <p className="mt-1 text-sm text-[#667085]">{total} sản phẩm</p>
          {category.description && <p className="mt-3 max-w-3xl text-sm leading-6 text-[#344054]">{category.description}</p>}
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-3 pt-5 sm:px-4">
        {category.children.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={`/danh-muc/${child.slug}`}
                className="group flex flex-col items-center rounded-lg border border-[#e4e9f2] bg-white p-2.5 text-center transition hover:border-gold hover:shadow-md"
              >
                <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-md bg-brand-50/60">
                  {child.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={child.imageUrl} alt={child.name} loading="lazy" className="h-full w-full object-contain p-1.5" />
                  ) : (
                    <span className="text-xl font-bold text-brand/30">{child.name.charAt(0)}</span>
                  )}
                </div>
                <span className="mt-2 line-clamp-2 text-xs font-bold leading-4 text-brand group-hover:text-gold-dark">{child.name}</span>
              </Link>
            ))}
          </div>
        )}

        {products.length === 0 ? (
          <p className="rounded-lg border border-[#dce5f1] bg-white py-16 text-center text-sm text-[#667085]">Chưa có sản phẩm trong danh mục này.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

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
