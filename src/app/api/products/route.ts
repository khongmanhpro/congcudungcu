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

const specSchema = z.object({
  label: z.string(),
  value: z.string(),
});

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  sku: z.string().optional().nullable(),
  price: z.number().int().min(0),
  salePrice: z.number().int().min(0).optional().nullable(),
  stock: z.number().int().default(0),
  shortDesc: z.string().optional().nullable(),
  description: z.string().default(""),
  specs: z.array(specSchema).optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  featured: z.boolean().default(false),
  weight: z.number().int().optional().nullable(),
  dimensions: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  images: z.array(imageSchema).optional(),
  publishedAt: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("pageSize") || "20");
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;

  const where: Record<string, unknown> = {};
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, brand: true, images: { orderBy: { position: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  if (d.sku) {
    const existingSku = await prisma.product.findUnique({ where: { sku: d.sku } });
    if (existingSku) return NextResponse.json({ error: "SKU đã tồn tại" }, { status: 400 });
  }

  const baseSlug = d.slug ? slugify(d.slug) : slugify(d.name);
  const slug = await uniqueSlug(baseSlug, async (s) => {
    const e = await prisma.product.findUnique({ where: { slug: s } });
    return !!e;
  });

  const product = await prisma.product.create({
    data: {
      name: d.name,
      slug,
      sku: d.sku || null,
      price: d.price,
      salePrice: d.salePrice ?? null,
      stock: d.stock,
      shortDesc: d.shortDesc || null,
      description: d.description,
      specs: d.specs ?? undefined,
      status: d.status,
      featured: d.featured,
      weight: d.weight ?? null,
      dimensions: d.dimensions ?? null,
      categoryId: d.categoryId || null,
      brandId: d.brandId || null,
      publishedAt: d.publishedAt ? new Date(d.publishedAt) : d.status === "PUBLISHED" ? new Date() : null,
      images: d.images?.length
        ? { create: d.images.map((img, i) => ({ url: img.url, alt: img.alt || null, position: img.position ?? i })) }
        : undefined,
    },
    include: { images: true },
  });

  return NextResponse.json(product, { status: 201 });
}
