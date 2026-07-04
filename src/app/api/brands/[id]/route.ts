import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { slugify, uniqueSlug } from "@/lib/slug";

const schema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  logoUrl: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
});

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const existing = await prisma.brand.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let slug = existing.slug;
  if (d.slug !== undefined && d.slug !== existing.slug) {
    const base = slugify(d.slug);
    slug = await uniqueSlug(base, async (s) => {
      const o = await prisma.brand.findUnique({ where: { slug: s } });
      return !!o && o.id !== id;
    });
  }

  const brand = await prisma.brand.update({
    where: { id },
    data: {
      ...(d.name !== undefined && { name: d.name }),
      slug,
      ...(d.logoUrl !== undefined && { logoUrl: d.logoUrl }),
      ...(d.country !== undefined && { country: d.country }),
    },
  });
  return NextResponse.json(brand);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.brand.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
