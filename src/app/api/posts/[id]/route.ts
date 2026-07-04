import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { slugify, uniqueSlug } from "@/lib/slug";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().optional(),
  excerpt: z.string().optional().nullable(),
  content: z.string().optional(),
  coverImage: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  seoTitle: z.string().optional().nullable(),
  seoDesc: z.string().optional().nullable(),
  publishedAt: z.string().optional().nullable(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: { category: true, tags: true, author: true },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let slug = existing.slug;
  if (d.slug !== undefined && d.slug !== existing.slug) {
    const baseSlug = slugify(d.slug);
    slug = await uniqueSlug(baseSlug, async (s) => {
      const o = await prisma.post.findUnique({ where: { slug: s } });
      return !!o && o.id !== id;
    });
  }

  const post = await prisma.post.update({
    where: { id },
    data: {
      ...(d.title !== undefined && { title: d.title }),
      slug,
      ...(d.excerpt !== undefined && { excerpt: d.excerpt }),
      ...(d.content !== undefined && { content: d.content }),
      ...(d.coverImage !== undefined && { coverImage: d.coverImage }),
      ...(d.categoryId !== undefined && { categoryId: d.categoryId }),
      ...(d.status !== undefined && { status: d.status }),
      ...(d.seoTitle !== undefined && { seoTitle: d.seoTitle }),
      ...(d.seoDesc !== undefined && { seoDesc: d.seoDesc }),
      ...(d.publishedAt !== undefined && {
        publishedAt: d.publishedAt ? new Date(d.publishedAt) : null,
      }),
      ...(d.tagIds !== undefined && { tags: { set: d.tagIds.map((tid) => ({ id: tid })) } }),
    },
  });

  return NextResponse.json(post);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
