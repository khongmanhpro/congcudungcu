import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.status !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const valid = ["NEW", "CONTACTED", "QUOTED", "CLOSED"];
  if (!valid.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const quote = await prisma.quoteRequest.update({
    where: { id },
    data: { status: body.status },
  });
  return NextResponse.json(quote);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.quoteRequest.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
