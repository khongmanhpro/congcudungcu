import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  const categoryId = request.nextUrl.searchParams.get("category")?.trim() || "";
  if (q.length < 2) return NextResponse.json({ products: [], categories: [] });

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        ...(categoryId ? { categoryId } : {}),
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
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
      select: { id: true, name: true, slug: true },
      take: 3,
    }),
  ]);

  return NextResponse.json({ products, categories });
}
