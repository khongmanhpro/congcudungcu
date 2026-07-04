import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatVND } from "@/lib/format";

export const revalidate = 0;

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const { q, category } = await searchParams;
  const query = (q || "").trim();
  const selectedCategory = category
    ? await prisma.category.findUnique({ where: { id: category }, select: { id: true, name: true } }).catch(() => null)
    : null;

  const products = query
    ? await prisma.product.findMany({
        where: {
          status: "PUBLISHED",
          ...(selectedCategory ? { categoryId: selectedCategory.id } : {}),
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { shortDesc: { contains: query, mode: "insensitive" } },
            { sku: { contains: query, mode: "insensitive" } },
          ],
        },
        include: { images: { take: 1, orderBy: { position: "asc" } } },
        take: 24,
      })
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Trang chủ</Link> / <span>Tìm kiếm</span>
      </nav>

      <h1 className="mb-6 text-2xl font-bold">
        Kết quả tìm kiếm{query ? `: "${query}"` : ""}
      </h1>
      {selectedCategory && (
        <p className="mb-4 text-sm text-muted-foreground">
          Đang lọc trong danh mục: <strong className="text-foreground">{selectedCategory.name}</strong>
        </p>
      )}

      {!query && <p className="text-muted-foreground">Nhập từ khóa vào ô tìm kiếm.</p>}
      {query && products.length === 0 && <p className="text-muted-foreground">Không tìm thấy sản phẩm phù hợp.</p>}
      {products.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <Link key={p.id} href={`/san-pham/${p.slug}`} className="group rounded-lg border bg-white p-3 hover:shadow-md">
              <div className="aspect-square overflow-hidden rounded-md bg-neutral-100">
                {p.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0].url} alt={p.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <h3 className="mt-2 line-clamp-2 text-sm font-medium group-hover:text-primary">{p.name}</h3>
              <div className="mt-1 text-sm font-bold text-primary">
                {(p.salePrice && p.salePrice > 0 ? p.salePrice : p.price) > 0
                  ? formatVND(p.salePrice && p.salePrice > 0 ? p.salePrice : p.price)
                  : "Liên hệ"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
