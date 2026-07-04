import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const schema = z.object({
  code: z.string().min(1).toUpperCase(),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.number().int().min(0),
  minOrder: z.number().int().default(0),
  expiresAt: z.string().optional().nullable(),
  usageLimit: z.number().int().optional().nullable(),
  active: z.boolean().default(true),
});

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const coupons = await prisma.coupon.findMany({
    include: { _count: { select: { orders: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(coupons);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const existing = await prisma.coupon.findUnique({ where: { code: d.code } });
  if (existing) return NextResponse.json({ error: "Mã đã tồn tại" }, { status: 400 });

  const coupon = await prisma.coupon.create({
    data: {
      code: d.code,
      type: d.type,
      value: d.value,
      minOrder: d.minOrder,
      expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
      usageLimit: d.usageLimit ?? null,
      active: d.active,
    },
  });
  return NextResponse.json(coupon, { status: 201 });
}
