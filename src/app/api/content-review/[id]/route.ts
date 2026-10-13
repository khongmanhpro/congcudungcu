import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getSession } from "@/lib/session";
import type { ProductDraft } from "@/lib/content-validate";
import { pingIndexNow } from "@/lib/indexnow";
import { productPath } from "@/lib/urls";

const schema = z.object({ action: z.enum(["approve", "reject"]) });

type Params = { params: Promise<{ id: string }> };

/** Duyệt (áp dụng bản nháp AI vào nội dung hiển thị) hoặc loại (xoá nháp, cho phép viết lại sau). */
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, slug: true, status: true, aiDraft: true, images: { orderBy: { position: "asc" }, take: 1, select: { id: true } } },
  });
  const draft = (product?.aiDraft as { draft?: ProductDraft } | null)?.draft;
  if (!product || !draft) return NextResponse.json({ error: "Không có bản nháp" }, { status: 404 });

  if (parsed.data.action === "reject") {
    await prisma.product.update({ where: { id }, data: { aiDraft: Prisma.DbNull, contentStatus: "ORIGINAL" } });
    return NextResponse.json({ ok: true });
  }

  await prisma.$transaction([
    prisma.product.update({
      where: { id },
      data: {
        description: draft.descriptionHtml,
        shortDesc: draft.shortDesc,
        seoTitle: draft.seoTitle,
        seoDesc: draft.seoDesc,
        faq: draft.faq,
        // chỉ thay thông số khi bản nháp có dữ liệu (không xoá thông số cũ)
        ...(draft.specs.length ? { specs: draft.specs } : {}),
        contentStatus: "REVIEWED",
        contentUpdatedAt: new Date(),
        aiDraft: Prisma.DbNull,
      },
    }),
    ...(product.images[0] && draft.imageAlt
      ? [prisma.productImage.update({ where: { id: product.images[0].id }, data: { alt: draft.imageAlt } })]
      : []),
  ]);
  if (product.status === "PUBLISHED") pingIndexNow([productPath(product.slug)]);
  return NextResponse.json({ ok: true });
}
