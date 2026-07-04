import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const settings = await prisma.setting.findMany();
  return NextResponse.json(Object.fromEntries(settings.map((s) => [s.key, s.value])));
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, string> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  // Upsert từng key
  await Promise.all(
    Object.entries(body).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}
