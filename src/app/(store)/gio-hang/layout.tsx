import type { Metadata } from "next";

// Đã Disallow trong robots.txt (xem src/app/robots.ts) — không thêm noindex ở đây để tránh
// tín hiệu mâu thuẫn (Googlebot không crawl được trang để đọc thẻ noindex).
export const metadata: Metadata = {
  title: "Giỏ hàng",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
