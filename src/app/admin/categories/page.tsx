import { prisma } from "@/lib/prisma";
import { CategoriesManager } from "./categories-manager";
import { FolderTree } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { parent: true, _count: { select: { products: true, posts: true, children: true } } },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Danh mục</h1>
        <p className="text-sm text-muted-foreground">{categories.length} danh mục (sản phẩm + bài viết)</p>
      </div>
      {categories.length === 0 ? (
        <div className="rounded-lg border bg-white py-12 text-center text-muted-foreground">
          <FolderTree className="mx-auto mb-2 h-8 w-8 opacity-50" />
          Chưa có danh mục nào.
        </div>
      ) : (
        <CategoriesManager initialCategories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          type: c.type,
          parentId: c.parentId,
          parentName: c.parent?.name || null,
          description: c.description,
          imageUrl: c.imageUrl,
          productCount: c._count.products,
          postCount: c._count.posts,
          childrenCount: c._count.children,
        }))} />
      )}
    </div>
  );
}
