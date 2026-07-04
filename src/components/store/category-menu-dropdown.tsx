"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronRight, Gauge, Hammer, Menu, Package, ShieldCheck, Wrench, Zap } from "lucide-react";
import { buildStandardProductCategories, type CatalogCategory } from "./catalog-categories";

const icons = [Wrench, ShieldCheck, Zap, Gauge, Package, Hammer];

export function CategoryMenuDropdown({ categories }: { categories: CatalogCategory[] }) {
  const [open, setOpen] = useState(false);
  const [menuBox, setMenuBox] = useState({ left: 0, top: 0, width: 280 });
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuCategories = buildStandardProductCategories(categories);

  const placeMenu = () => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMenuBox({
      left: rect.left,
      top: rect.bottom,
      width: rect.width,
    });
  };

  const toggleMenu = () => {
    if (!open) placeMenu();
    setOpen((value) => !value);
  };

  useEffect(() => {
    if (!open) return;

    const close = () => setOpen(false);
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("scroll", close, { capture: true, passive: true });
    window.addEventListener("resize", close);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("scroll", close, { capture: true });
      window.removeEventListener("resize", close);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative hidden w-[280px] shrink-0 lg:block">
      <button
        type="button"
        onClick={toggleMenu}
        aria-expanded={open}
        className="flex h-12 w-full items-center gap-2 rounded-t-md bg-[#0757c9] px-5 text-left text-sm font-bold text-white transition hover:bg-[#0048a8]"
      >
        <Menu className="h-5 w-5" />
        Danh mục sản phẩm
      </button>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[9999] max-h-[calc(100vh-150px)] overflow-y-auto rounded-b-md border border-t-0 border-[#dce5f1] bg-white shadow-2xl"
              style={{ left: menuBox.left, top: menuBox.top, width: menuBox.width }}
            >
              <div className="divide-y divide-[#edf1f7]">
                {menuCategories.map((category, index) => {
                  const Icon = icons[index % icons.length];
                  return (
                    <Link
                      key={category.id}
                      href={`/danh-muc/${category.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#253044] transition hover:bg-[#f0f6ff] hover:text-[#0757c9]"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-[#667085]" />
                      <span className="line-clamp-1 flex-1">{category.name}</span>
                      <ChevronRight className="h-4 w-4 text-[#98a2b3]" />
                    </Link>
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
