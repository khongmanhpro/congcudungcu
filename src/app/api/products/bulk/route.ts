import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const schema = z.object({
  ids: z.array(z.string()).min(1),
  action: z.enum(["publish", "draft", "archive", "delete"]),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { ids, action } = parsed.data;

  if (action === "delete") {
    await prisma.product.deleteMany({ where: { id: { in: ids } } });
  } else {
    const status = action === "publish" ? "PUBLISHED" : action === "draft" ? "DRAFT" : "ARCHIVED";
    await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
  }

  return NextResponse.json({ ok: true, count: ids.length });
}
