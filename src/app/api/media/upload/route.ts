import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  // Validate
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Định dạng không hỗ trợ. Chọn JPG/PNG/WebP/GIF/AVIF" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File quá lớn (tối đa 5MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  const url = `/uploads/${filename}`;
  const alt = formData.get("alt") as string | null;

  const media = await prisma.media.create({
    data: { url, alt: alt || null, type: file.type, size: file.size, bucket: "media" },
  });

  return NextResponse.json(media);
}
