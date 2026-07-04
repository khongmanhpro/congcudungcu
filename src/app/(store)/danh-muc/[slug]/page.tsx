import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatVND } from "@/lib/format";

export const revalidate = 60;

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    include: { children: true },
  });

  if (!category || category.type !== "PRODUCT") notFound();

  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED", OR: [{ categoryId: category.id }, { category: { parentId: category.id } }] },
    include: { images: { take: 1, orderBy: { position: "asc" } } },
    take: 24,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Trang chủ</Link> / <span>{category.name}</span>
      </nav>

      <h1 className="mb-6 text-2xl font-bold">{category.name}</h1>
      {category.description && <p className="mb-6 text-muted-foreground">{category.description}</p>}

      {category.children.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {category.children.map((c) => (
            <Link key={c.id} href={`/danh-muc/${c.slug}`} className="rounded-full border px-3 py-1 text-sm hover:bg-neutral-50">
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <p className="text-muted-foreground">Chưa có sản phẩm trong danh mục này.</p>
      ) : (
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
              <div className="mt-1 text-sm font-bold text-primary">{formatVND(p.salePrice ?? p.price)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
