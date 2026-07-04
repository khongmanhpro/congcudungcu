import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { slugify, uniqueSlug } from "@/lib/slug";

const imageSchema = z.object({
  url: z.string(),
  alt: z.string().optional().nullable(),
  position: z.number().optional(),
});

const specSchema = z.object({ label: z.string(), value: z.string() });

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  sku: z.string().optional().nullable(),
  price: z.number().int().min(0).optional(),
  salePrice: z.number().int().min(0).optional().nullable(),
  stock: z.number().int().optional(),
  shortDesc: z.string().optional().nullable(),
  description: z.string().optional(),
  specs: z.array(specSchema).optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  featured: z.boolean().optional(),
  weight: z.number().int().optional().nullable(),
  dimensions: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  images: z.array(imageSchema).optional(),
  publishedAt: z.string().optional().nullable(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, brand: true, images: { orderBy: { position: "asc" } } },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (d.sku !== undefined && d.sku !== existing.sku) {
    if (d.sku) {
      const skuOwner = await prisma.product.findUnique({ where: { sku: d.sku } });
      if (skuOwner && skuOwner.id !== id) return NextResponse.json({ error: "SKU đã tồn tại" }, { status: 400 });
    }
  }

  let slug = existing.slug;
  if (d.slug !== undefined && d.slug !== existing.slug) {
    const base = slugify(d.slug);
    slug = await uniqueSlug(base, async (s) => {
      const o = await prisma.product.findUnique({ where: { slug: s } });
      return !!o && o.id !== id;
    });
  }

  // Cập nhật images: xóa cũ, tạo mới
  if (d.images !== undefined) {
    await prisma.productImage.deleteMany({ where: { productId: id } });
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(d.name !== undefined && { name: d.name }),
      slug,
      ...(d.sku !== undefined && { sku: d.sku }),
      ...(d.price !== undefined && { price: d.price }),
      ...(d.salePrice !== undefined && { salePrice: d.salePrice }),
      ...(d.stock !== undefined && { stock: d.stock }),
      ...(d.shortDesc !== undefined && { shortDesc: d.shortDesc }),
      ...(d.description !== undefined && { description: d.description }),
      ...(d.specs !== undefined && { specs: d.specs ?? undefined }),
      ...(d.status !== undefined && { status: d.status }),
      ...(d.featured !== undefined && { featured: d.featured }),
      ...(d.weight !== undefined && { weight: d.weight }),
      ...(d.dimensions !== undefined && { dimensions: d.dimensions }),
      ...(d.categoryId !== undefined && { categoryId: d.categoryId }),
      ...(d.brandId !== undefined && { brandId: d.brandId }),
      ...(d.publishedAt !== undefined && {
        publishedAt: d.publishedAt ? new Date(d.publishedAt) : null,
      }),
      ...(d.images !== undefined && {
        images: {
          create: d.images.map((img, i) => ({ url: img.url, alt: img.alt || null, position: img.position ?? i })),
        },
      }),
    },
    include: { images: { orderBy: { position: "asc" } } },
  });

  return NextResponse.json(product);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// PATCH: inline edit (price, stock, status, salePrice)
const patchSchema = z.object({
  price: z.number().int().min(0).optional(),
  salePrice: z.number().int().min(0).nullable().optional(),
  stock: z.number().int().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const product = await prisma.product.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(product);
}
