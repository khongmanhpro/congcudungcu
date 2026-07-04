import { cookies } from "next/headers";
import { AUTH_COOKIE, verifySessionToken, type SessionPayload } from "./auth";
import { prisma } from "./prisma";

/** Đọc session payload từ cookie (không query DB) */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Đọc session + query DB lấy user đầy đủ */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true, phone: true },
  });
  return user;
}

/** Yêu cầu admin/editor, throw redirect nếu không có quyền */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
    const { redirect } = await import("next/navigation");
    redirect("/login?next=/admin");
  }
  return user;
}

/** Yêu cầu đăng nhập (customer cũng được) */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }
  return user;
}
