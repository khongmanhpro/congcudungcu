import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, brands] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { position: "asc" } } },
    }),
    prisma.category.findMany({ where: { type: "PRODUCT" }, orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  const productSerializable = {
    ...product,
    publishedAt: product.publishedAt ? product.publishedAt.toISOString() : null,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/products" className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ChevronLeft className="h-4 w-4" /> Quay lại
        </Link>
        <h1 className="text-2xl font-bold">Sửa sản phẩm</h1>
        <p className="text-sm text-muted-foreground">{product.name}</p>
      </div>
      <ProductForm product={productSerializable} categories={categories} brands={brands} />
    </div>
  );
}
