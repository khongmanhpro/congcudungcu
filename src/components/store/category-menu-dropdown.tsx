"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import type { CatalogCategory } from "./catalog-categories";

type NavExtra = { name: string; href: string };

/** Thanh menu ngang: mỗi danh mục cha một ô, rê chuột hiện bảng danh mục con/cháu. */
export function CategoryNavBar({ categories, extras = [] }: { categories: CatalogCategory[]; extras?: NavExtra[] }) {
  const [active, setActive] = useState<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  // Tối đa 7 ô; dư thì 6 ô đầu + ô "Danh mục khác" chứa phần còn lại (vừa 1 hàng ở 1280px)
  const items: CatalogCategory[] =
    categories.length > 7
      ? [...categories.slice(0, 6), { id: "__more", name: "Danh mục khác", slug: "", children: categories.slice(6) }]
      : categories;
  const current = active !== null ? items[active] : null;

  const open = (index: number) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setActive(index);
  };
  const scheduleClose = () => {
    closeTimer.current = window.setTimeout(() => setActive(null), 120);
  };

  return (
    <div className="relative" onMouseLeave={scheduleClose}>
      <ul className="flex overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((category, index) => (
          <li key={category.id} className="shrink-0 border-r border-white/15 last:border-r-0" onMouseEnter={() => open(index)}>
            <Link
              href={category.slug ? `/danh-muc/${category.slug}` : "/san-pham"}
              onClick={() => setActive(null)}
              className={`flex items-center gap-1 whitespace-nowrap px-3 py-3 text-sm font-bold transition xl:px-3.5 ${active === index ? "bg-white/10 text-gold" : "text-white hover:text-gold"}`}
            >
              {category.name}
              {!category.slug && <ChevronDown className="h-4 w-4" />}
            </Link>
          </li>
        ))}
        {extras.map((extra) => (
          <li key={extra.href} className="shrink-0 border-l border-white/15" onMouseEnter={() => setActive(null)}>
            <Link href={extra.href} className="block whitespace-nowrap px-3 py-3 text-sm font-bold text-white hover:text-gold xl:px-3.5">
              {extra.name}
            </Link>
          </li>
        ))}
      </ul>

      {current && !!current.children?.length && (
        <div
          className="absolute inset-x-0 top-full z-50 hidden border border-t-0 border-gold/70 bg-white p-5 shadow-2xl lg:block"
          onMouseEnter={() => active !== null && open(active)}
        >
          <Link href={current.slug ? `/danh-muc/${current.slug}` : "/san-pham"} onClick={() => setActive(null)} className="mb-3 inline-flex items-center gap-1 text-sm font-bold uppercase text-brand hover:text-gold-dark">
            {current.slug ? current.name : "Tất cả sản phẩm"} <ChevronRight className="h-4 w-4" />
          </Link>
          <div className="grid grid-cols-4 gap-x-6 gap-y-4">
            {current.children.map((child) => (
              <div key={child.id} className="min-w-0">
                <Link href={`/danh-muc/${child.slug}`} onClick={() => setActive(null)} className="block text-sm font-bold text-[#0f172a] hover:text-brand">
                  {child.name}
                </Link>
                {!!child.children?.length && (
                  <ul className="mt-1.5 space-y-1">
                    {child.children.slice(0, 10).map((leaf) => (
                      <li key={leaf.id}>
                        <Link href={`/danh-muc/${leaf.slug}`} onClick={() => setActive(null)} className="text-[13px] text-[#475569] hover:text-brand">
                          {leaf.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Ngăn kéo danh mục cho điện thoại. */
export function MobileCategoryDrawer({ categories }: { categories: CatalogCategory[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Mở danh mục" className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-brand hover:bg-brand-50 lg:hidden">
        <Menu className="h-6 w-6" />
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button type="button" aria-label="Đóng" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <nav className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex h-14 items-center justify-between bg-brand px-4 text-sm font-bold uppercase text-white">
              Danh mục sản phẩm
              <button type="button" onClick={() => setOpen(false)} aria-label="Đóng danh mục"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {categories.map((category) => (
                <details key={category.id} className="group border-b border-[#edf1f7]">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-bold text-[#0f172a]">
                    <Link href={`/danh-muc/${category.slug}`} onClick={() => setOpen(false)}>{category.name}</Link>
                    {!!category.children?.length && <ChevronDown className="h-4 w-4 text-[#94a3b8] transition group-open:rotate-180" />}
                  </summary>
                  {!!category.children?.length && (
                    <ul className="bg-brand-50/60 pb-2">
                      {category.children.map((child) => (
                        <li key={child.id}>
                          <Link href={`/danh-muc/${child.slug}`} onClick={() => setOpen(false)} className="block px-7 py-2 text-[13px] text-[#334155]">
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </details>
              ))}
              <div className="space-y-1 p-4 text-sm font-bold text-brand">
                <Link href="/san-pham" onClick={() => setOpen(false)} className="block py-1.5">Tất cả sản phẩm</Link>
                <Link href="/tin-tuc" onClick={() => setOpen(false)} className="block py-1.5">Thư viện Media</Link>
                <Link href="/lien-he" onClick={() => setOpen(false)} className="block py-1.5">Liên hệ</Link>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
