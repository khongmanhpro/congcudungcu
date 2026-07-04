import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || "1");
  const pageSize = 20;
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true, payment: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}
