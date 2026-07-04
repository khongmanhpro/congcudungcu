import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { slugify, uniqueSlug } from "@/lib/slug";

const schema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  type: z.enum(["PRODUCT", "POST"]).optional(),
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

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let slug = existing.slug;
  if (d.slug !== undefined && d.slug !== existing.slug) {
    const base = slugify(d.slug);
    slug = await uniqueSlug(base, async (s) => {
      const o = await prisma.category.findUnique({ where: { slug: s } });
      return !!o && o.id !== id;
    });
  }

  const cat = await prisma.category.update({
    where: { id },
    data: {
      ...(d.name !== undefined && { name: d.name }),
      slug,
      ...(d.description !== undefined && { description: d.description }),
      ...(d.imageUrl !== undefined && { imageUrl: d.imageUrl }),
      ...(d.parentId !== undefined && { parentId: d.parentId }),
      ...(d.type !== undefined && { type: d.type }),
    },
  });
  return NextResponse.json(cat);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
