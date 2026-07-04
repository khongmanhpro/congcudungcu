import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, AUTH_COOKIE } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2, "Tên ít nhất 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
  phone: z.string().min(9, "Số điện thoại không hợp lệ").optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: d.email } });
  if (existing) {
    return NextResponse.json({ error: "Email đã được đăng ký" }, { status: 400 });
  }

  const passwordHash = await hashPassword(d.password);
  const user = await prisma.user.create({
    data: {
      name: d.name,
      email: d.email,
      passwordHash,
      role: "CUSTOMER",
    },
  });

  // Tạo Customer record
  await prisma.customer.create({
    data: {
      userId: user.id,
      phone: d.phone || null,
    },
  });

  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const res = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
