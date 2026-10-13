"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-store";

export function CartButton() {
  const count = useCart((s) => s.items.reduce((sum, i) => sum + i.qty, 0));
  return (
    <Link
      href="/gio-hang"
      aria-label="Giỏ hàng"
      className="relative grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand shadow-[0_0_0_4px_rgba(0,56,105,.06)] hover:bg-brand hover:text-white"
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-brand-dark">
        {count}
      </span>
    </Link>
  );
}
