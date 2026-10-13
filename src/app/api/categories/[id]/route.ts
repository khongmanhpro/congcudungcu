import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { slugify, uniqueSlug } from "@/lib/slug";
import { validateCategoryPlacement } from "@/lib/category-rules";
import { recordRedirect } from "@/lib/redirects";
import { pingIndexNow } from "@/lib/indexnow";
import { categoryPath } from "@/lib/urls";

const schema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  type: z.enum(["PRODUCT", "POST"]).optional(),
  // SEO / nội dung hub
  seoTitle: z.string().max(70).optional().nullable(),
  seoDesc: z.string().max(170).optional().nullable(),
  intro: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  faq: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).max(15).optional().nullable(),
  position: z.number().int().optional(),
  featured: z.boolean().optional(),
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

  const existing = await prisma.category.findUnique({
    where: { id },
    include: { parent: { select: { slug: true } }, children: { select: { slug: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let slug = existing.slug;
  if (d.slug !== undefined && d.slug !== existing.slug) {
    const base = slugify(d.slug);
    slug = await uniqueSlug(base, async (s) => {
      const o = await prisma.category.findUnique({ where: { slug: s } });
      return !!o && o.id !== id;
    });
  }

  const invalid = await validateCategoryPlacement({
    id,
    slug,
    parentId: d.parentId !== undefined ? d.parentId : existing.parentId,
    type: d.type ?? existing.type,
  });
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  const cat = await prisma.category.update({
    where: { id },
    data: {
      ...(d.name !== undefined && { name: d.name }),
      slug,
      ...(d.description !== undefined && { description: d.description }),
      ...(d.imageUrl !== undefined && { imageUrl: d.imageUrl }),
      ...(d.parentId !== undefined && { parentId: d.parentId }),
      ...(d.type !== undefined && { type: d.type }),
      ...(d.seoTitle !== undefined && { seoTitle: d.seoTitle }),
      ...(d.seoDesc !== undefined && { seoDesc: d.seoDesc }),
      ...(d.intro !== undefined && { intro: d.intro }),
      ...(d.content !== undefined && { content: d.content }),
      ...(d.faq !== undefined && { faq: d.faq ?? undefined }),
      ...(d.position !== undefined && { position: d.position }),
      ...(d.featured !== undefined && { featured: d.featured }),
    },
    include: { parent: { select: { slug: true } } },
  });

  // đường dẫn đổi (slug hoặc danh mục cha) → 301 cho chính nó và các danh mục con
  if (cat.type === "PRODUCT") {
    const oldPath = categoryPath(existing);
    const newPath = categoryPath(cat);
    if (oldPath !== newPath) {
      await recordRedirect(oldPath, newPath);
      for (const child of existing.children) {
        await recordRedirect(`${oldPath}/${child.slug}`, `${newPath}/${child.slug}`);
      }
    }
    pingIndexNow([newPath]);
  }
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
