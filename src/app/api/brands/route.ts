import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { slugify, uniqueSlug } from "@/lib/slug";

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  logoUrl: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
});

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(brands);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const baseSlug = d.slug ? slugify(d.slug) : slugify(d.name);
  const slug = await uniqueSlug(baseSlug, async (s) => !!(await prisma.brand.findUnique({ where: { slug: s } })));

  const brand = await prisma.brand.create({
    data: { name: d.name, slug, logoUrl: d.logoUrl || null, country: d.country || null },
  });
  return NextResponse.json(brand, { status: 201 });
}
