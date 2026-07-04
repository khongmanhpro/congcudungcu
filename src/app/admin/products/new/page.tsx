import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ where: { type: "PRODUCT" }, orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/products" className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ChevronLeft className="h-4 w-4" /> Quay lại
        </Link>
        <h1 className="text-2xl font-bold">Thêm sản phẩm mới</h1>
      </div>
      <ProductForm product={null} categories={categories} brands={brands} />
    </div>
  );
}
