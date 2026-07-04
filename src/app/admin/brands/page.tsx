import { prisma } from "@/lib/prisma";
import { BrandsManager } from "./brands-manager";
import { Tag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Thương hiệu</h1>
        <p className="text-sm text-muted-foreground">{brands.length} thương hiệu</p>
      </div>
      {brands.length === 0 ? (
        <div className="rounded-lg border bg-white py-12 text-center text-muted-foreground">
          <Tag className="mx-auto mb-2 h-8 w-8 opacity-50" />
          Chưa có thương hiệu nào.
        </div>
      ) : (
        <BrandsManager initialBrands={brands.map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          logoUrl: b.logoUrl,
          country: b.country,
          productCount: b._count.products,
        }))} />
      )}
    </div>
  );
}
