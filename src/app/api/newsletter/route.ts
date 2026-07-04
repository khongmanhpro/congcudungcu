import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });

  // Lưu email vào Setting với key newsletter_emails (danh sách phân tách bởi newline)
  const existing = await prisma.setting.findUnique({ where: { key: "newsletter_emails" } });
  const emails = (existing?.value || "").split("\n").filter(Boolean);
  if (!emails.includes(parsed.data.email)) {
    emails.push(parsed.data.email);
    await prisma.setting.upsert({
      where: { key: "newsletter_emails" },
      update: { value: emails.join("\n") },
      create: { key: "newsletter_emails", value: parsed.data.email },
    });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
