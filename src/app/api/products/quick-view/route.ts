import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { take: 1, orderBy: { position: "asc" } },
      brand: true,
      category: true,
    },
  });

  if (!product || product.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    salePrice: product.salePrice,
    stock: product.stock,
    shortDesc: product.shortDesc,
    sku: product.sku,
    image: product.images[0]?.url || null,
    brand: product.brand?.name || null,
    category: product.category?.name || null,
  });
}
