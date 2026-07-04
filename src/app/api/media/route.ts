import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const media = await prisma.media.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json(media);
}

const schema = z.object({
  url: z.string().url(),
  alt: z.string().optional().nullable(),
  type: z.string().default("image"),
  size: z.number().default(0),
  bucket: z.string().default("media"),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const media = await prisma.media.create({ data: d });
  return NextResponse.json(media, { status: 201 });
}
