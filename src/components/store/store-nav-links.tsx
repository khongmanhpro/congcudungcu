"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavCategory = {
  id: string;
  name: string;
  slug: string;
};

export function StoreNavLinks({ categories }: { categories: NavCategory[] }) {
  const pathname = usePathname();
  const linkClass = (href: string) => {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return `whitespace-nowrap border-b-2 py-3.5 transition ${active ? "border-gold text-gold" : "border-transparent text-white/90 hover:text-gold"}`;
  };

  return (
    <div className="flex min-w-0 flex-1 items-center gap-5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Link href="/" className={linkClass("/")}>Trang chủ</Link>
      <Link href="/gioi-thieu" className={linkClass("/gioi-thieu")}>Giới thiệu</Link>
      <Link href="/san-pham" className={linkClass("/san-pham")}>Sản phẩm</Link>
      {categories.slice(0, 3).map((category) => (
        <Link key={category.id} href={`/danh-muc/${category.slug}`} className={`hidden xl:inline ${linkClass(`/danh-muc/${category.slug}`)}`}>
          {category.name}
        </Link>
      ))}
      <Link href="/khuyen-mai" className={linkClass("/khuyen-mai")}>Khuyến mãi</Link>
      <Link href="/tin-tuc" className={linkClass("/tin-tuc")}>Tin tức</Link>
      <Link href="/lien-he" className={linkClass("/lien-he")}>Liên hệ</Link>
    </div>
  );
}
