import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { slugify, uniqueSlug } from "@/lib/slug";

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  type: z.enum(["PRODUCT", "POST"]).default("PRODUCT"),
});

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const categories = await prisma.category.findMany({
    include: { parent: true, _count: { select: { products: true, posts: true, children: true } } },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(categories);
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
  const slug = await uniqueSlug(baseSlug, async (s) => !!(await prisma.category.findUnique({ where: { slug: s } })));

  const cat = await prisma.category.create({
    data: {
      name: d.name,
      slug,
      description: d.description || null,
      imageUrl: d.imageUrl || null,
      parentId: d.parentId || null,
      type: d.type,
    },
  });
  return NextResponse.json(cat, { status: 201 });
}
