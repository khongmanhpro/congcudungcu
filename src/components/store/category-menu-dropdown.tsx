"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, LayoutGrid, Menu, X } from "lucide-react";
import type { CatalogCategory } from "./catalog-categories";

/** Danh sách danh mục cha + bảng con/cháu hiện khi rê chuột (mega menu). */
function MegaPanel({ categories, onNavigate, className = "" }: { categories: CatalogCategory[]; onNavigate?: () => void; className?: string }) {
  const [active, setActive] = useState<number | null>(null);
  const current = active !== null ? categories[active] : null;

  return (
    <div className={`relative ${className}`} onMouseLeave={() => setActive(null)}>
      <ul className="divide-y divide-[#edf1f7] bg-white">
        {categories.map((category, index) => (
          <li key={category.id} onMouseEnter={() => setActive(index)}>
            <Link
              href={`/danh-muc/${category.slug}`}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold transition ${active === index ? "bg-brand-50 text-brand" : "text-[#253044] hover:bg-brand-50 hover:text-brand"}`}
            >
              {category.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={category.imageUrl} alt="" className="h-6 w-6 shrink-0 rounded object-contain" />
              ) : (
                <LayoutGrid className="h-4 w-4 shrink-0 text-[#98a2b3]" />
              )}
              <span className="line-clamp-1 flex-1">{category.name}</span>
              {!!category.children?.length && <ChevronRight className="h-4 w-4 shrink-0 text-[#98a2b3]" />}
            </Link>
          </li>
        ))}
      </ul>

      {current && !!current.children?.length && (
        <div className="absolute left-full top-0 z-50 min-h-full w-[min(760px,calc(100vw-340px))] border border-[#dce5f1] bg-white p-5 shadow-2xl">
          <Link href={`/danh-muc/${current.slug}`} onClick={onNavigate} className="mb-4 inline-flex items-center gap-1 text-sm font-bold uppercase text-brand hover:text-gold-dark">
            {current.name} <ChevronRight className="h-4 w-4" />
          </Link>
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            {current.children.map((child) => (
              <div key={child.id} className="min-w-0">
                <Link href={`/danh-muc/${child.slug}`} onClick={onNavigate} className="block text-[13px] font-bold text-[#1d2939] hover:text-brand">
                  {child.name}
                </Link>
                {!!child.children?.length && (
                  <ul className="mt-1.5 space-y-1">
                    {child.children.slice(0, 8).map((leaf) => (
                      <li key={leaf.id}>
                        <Link href={`/danh-muc/${leaf.slug}`} onClick={onNavigate} className="text-xs text-[#667085] hover:text-brand">
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

/** Nút "Danh mục sản phẩm" trên thanh menu (desktop). */
export function CategoryMenuDropdown({ categories }: { categories: CatalogCategory[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative hidden w-[280px] shrink-0 lg:block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex h-12 w-full items-center gap-2.5 bg-brand-dark px-5 text-left text-[13px] font-bold uppercase tracking-wide text-white transition hover:bg-black/30"
      >
        <Menu className="h-5 w-5" />
        <span className="flex-1">Danh mục sản phẩm</span>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 w-full border border-t-0 border-[#dce5f1] shadow-2xl">
          <MegaPanel categories={categories} onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

/** Cột danh mục luôn mở bên trái banner trang chủ (desktop). */
export function CategorySidebar({ categories }: { categories: CatalogCategory[] }) {
  return (
    <aside className="hidden lg:block">
      <div className="flex h-11 items-center gap-2.5 rounded-t-lg bg-brand-dark px-4 text-[13px] font-bold uppercase tracking-wide text-white">
        <Menu className="h-5 w-5" /> Danh mục sản phẩm
      </div>
      <MegaPanel categories={categories.slice(0, 12)} className="rounded-b-lg border border-t-0 border-[#dce5f1]" />
    </aside>
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
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-[#1d2939]">
                    <Link href={`/danh-muc/${category.slug}`} onClick={() => setOpen(false)}>{category.name}</Link>
                    {!!category.children?.length && <ChevronDown className="h-4 w-4 text-[#98a2b3] transition group-open:rotate-180" />}
                  </summary>
                  {!!category.children?.length && (
                    <ul className="bg-brand-50/60 pb-2">
                      {category.children.map((child) => (
                        <li key={child.id}>
                          <Link href={`/danh-muc/${child.slug}`} onClick={() => setOpen(false)} className="block px-7 py-2 text-[13px] text-[#344054]">
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </details>
              ))}
              <div className="space-y-1 p-4 text-sm font-semibold text-brand">
                <Link href="/san-pham" onClick={() => setOpen(false)} className="block py-1.5">Tất cả sản phẩm</Link>
                <Link href="/tin-tuc" onClick={() => setOpen(false)} className="block py-1.5">Tin tức</Link>
                <Link href="/lien-he" onClick={() => setOpen(false)} className="block py-1.5">Liên hệ</Link>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
