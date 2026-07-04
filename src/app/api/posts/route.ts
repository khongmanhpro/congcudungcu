import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { slugify, uniqueSlug } from "@/lib/slug";

const createSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().default(""),
  coverImage: z.string().optional(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  seoTitle: z.string().optional(),
  seoDesc: z.string().optional(),
  publishedAt: z.string().optional(),
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

  const where: Record<string, unknown> = {};
  if (search) where.title = { contains: search, mode: "insensitive" };
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: { category: true, author: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.post.count({ where }),
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

  const baseSlug = d.slug ? slugify(d.slug) : slugify(d.title);
  const slug = await uniqueSlug(baseSlug, async (s) => {
    const existing = await prisma.post.findUnique({ where: { slug: s } });
    return !!existing;
  });

  const post = await prisma.post.create({
    data: {
      title: d.title,
      slug,
      excerpt: d.excerpt || null,
      content: d.content,
      coverImage: d.coverImage || null,
      categoryId: d.categoryId || null,
      status: d.status,
      seoTitle: d.seoTitle || null,
      seoDesc: d.seoDesc || null,
      publishedAt: d.publishedAt ? new Date(d.publishedAt) : d.status === "PUBLISHED" ? new Date() : null,
      authorId: session.userId,
      tags: d.tagIds?.length ? { connect: d.tagIds.map((id) => ({ id })) } : undefined,
    },
  });

  return NextResponse.json(post, { status: 201 });
}
