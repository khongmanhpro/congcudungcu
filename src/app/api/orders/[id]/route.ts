import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  status: z.enum(["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]).optional(),
  carrier: z.string().nullable().optional(),
  trackingCode: z.string().nullable().optional(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, payment: true, shipment: true, customer: true, coupon: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  // Cập nhật shipment nếu có carrier/trackingCode
  if (d.carrier !== undefined || d.trackingCode !== undefined) {
    const existing = await prisma.shipment.findUnique({ where: { orderId: id } });
    if (existing) {
      await prisma.shipment.update({
        where: { orderId: id },
        data: {
          ...(d.carrier !== undefined && { carrier: d.carrier }),
          ...(d.trackingCode !== undefined && { trackingCode: d.trackingCode }),
        },
      });
    } else {
      await prisma.shipment.create({
        data: {
          orderId: id,
          carrier: d.carrier || null,
          trackingCode: d.trackingCode || null,
          fee: 0,
          status: "PENDING",
        },
      });
    }
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      ...(d.status && { status: d.status, paidAt: d.status === "PAID" ? new Date() : undefined }),
    },
    include: { items: true, payment: true, shipment: true },
  });
  return NextResponse.json(order);
}
