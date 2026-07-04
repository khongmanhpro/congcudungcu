import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/auth";

const profileSchema = z.object({
  name: z.string().min(2, "Tên ít nhất 2 ký tự"),
  phone: z.string().min(9, "SĐT không hợp lệ").optional().nullable(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "Mật khẩu mới tối thiểu 6 ký tự"),
});

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  // Đổi mật khẩu
  if (body.type === "password") {
    const parsed = passwordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const full = await prisma.user.findUnique({ where: { id: user.id } });
    if (!full?.passwordHash) {
      return NextResponse.json({ error: "Tài khoản không có mật khẩu" }, { status: 400 });
    }
    const ok = await verifyPassword(parsed.data.currentPassword, full.passwordHash);
    if (!ok) return NextResponse.json({ error: "Mật khẩu hiện tại không đúng" }, { status: 400 });

    const newHash = await hashPassword(parsed.data.newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });
    return NextResponse.json({ ok: true });
  }

  // Cập nhật profile
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
    },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  // Cập nhật Customer.phone nếu có
  if (parsed.data.phone) {
    await prisma.customer.updateMany({
      where: { userId: user.id },
      data: { phone: parsed.data.phone },
    });
  }

  return NextResponse.json(updated);
}
