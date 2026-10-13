import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCategorySubtreeIds } from "@/lib/categories";
import { categoryPath } from "@/lib/urls";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  const categoryId = request.nextUrl.searchParams.get("category")?.trim() || "";
  if (q.length < 2) return NextResponse.json({ products: [], categories: [] });

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        ...(categoryId ? { categoryId: { in: await getCategorySubtreeIds(categoryId) } } : {}),
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
          { model: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, slug: true, price: true, salePrice: true },
      take: 6,
    }),
    prisma.category.findMany({
      where: {
        type: "PRODUCT",
        name: { contains: q, mode: "insensitive" },
      },
      select: { id: true, name: true, slug: true, parent: { select: { slug: true } } },
      take: 3,
    }),
  ]);

  return NextResponse.json({
    products,
    categories: categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, path: categoryPath(c) })),
  });
}
