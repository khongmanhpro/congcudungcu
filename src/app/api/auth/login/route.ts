import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken, AUTH_COOKIE } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Email hoặc mật khẩu không hợp lệ" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user || !user.passwordHash) {
    return NextResponse.json(
      { error: "Email hoặc mật khẩu không đúng" },
      { status: 401 },
    );
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "Email hoặc mật khẩu không đúng" },
      { status: 401 },
    );
  }

  // Chỉ admin/editor được vào admin
  if (user.role === "CUSTOMER") {
    return NextResponse.json(
      { error: "Tài khoản không có quyền truy cập admin" },
      { status: 403 },
    );
  }

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
    maxAge: 60 * 60 * 24 * 7, // 7 ngày
  });
  return res;
}
