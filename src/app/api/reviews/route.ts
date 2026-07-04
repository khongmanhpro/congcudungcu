import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });

  const reviews = await prisma.review.findMany({
    where: { productId, approved: true },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  return NextResponse.json({ reviews, avg, count: reviews.length });
}

const schema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  content: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  // Kiểm tra đã mua sản phẩm này chưa (optional)
  // const hasPurchased = await prisma.orderItem.findFirst({
  //   where: { productId: d.productId, order: { customerId: session.userId, status: "DELIVERED" } },
  // });
  // if (!hasPurchased) return NextResponse.json({ error: "Bạn cần mua sản phẩm trước khi đánh giá" }, { status: 403 });

  // Kiểm tra đã review chưa
  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId: d.productId, userId: session.userId } },
  });
  if (existing) return NextResponse.json({ error: "Bạn đã đánh giá sản phẩm này" }, { status: 400 });

  const review = await prisma.review.create({
    data: {
      productId: d.productId,
      userId: session.userId,
      rating: d.rating,
      content: d.content || null,
      approved: false, // chờ admin duyệt
    },
  });

  return NextResponse.json(review, { status: 201 });
}
