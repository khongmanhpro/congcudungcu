import type { Metadata } from "next";

// Trang tiện ích: không index (tránh trang mỏng/trùng lặp), vẫn cho bot đi theo link
export const metadata: Metadata = {
  title: "Giỏ hàng",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
