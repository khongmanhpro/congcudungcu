import { permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * Tra bảng Redirect cho đường dẫn không tồn tại; có thì chuyển hướng vĩnh viễn (308 — Google xử lý như 301).
 * Gọi ở nhánh "không tìm thấy" của các trang trước khi notFound().
 */
export async function redirectIfMoved(pathname: string): Promise<void> {
  const row = await prisma.redirect.findUnique({ where: { from: pathname } }).catch(() => null);
  if (row && row.to !== pathname) permanentRedirect(row.to);
}

/** Ghi redirect khi đổi đường dẫn (gọi từ API sửa slug). Chống vòng lặp và nối chuỗi redirect. */
export async function recordRedirect(from: string, to: string): Promise<void> {
  if (from === to) return;
  await prisma.$transaction([
    // xoá redirect ngược (to → from) nếu có, tránh vòng lặp
    prisma.redirect.deleteMany({ where: { from: to } }),
    // các redirect đang trỏ về "from" giờ trỏ thẳng tới đích mới (không chuỗi 2 bước)
    prisma.redirect.updateMany({ where: { to: from }, data: { to } }),
    prisma.redirect.upsert({ where: { from }, update: { to, code: 301 }, create: { from, to, code: 301 } }),
  ]);
}
