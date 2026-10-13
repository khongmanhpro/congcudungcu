"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-store";

export function CartButton() {
  const count = useCart((s) => s.items.reduce((sum, i) => sum + i.qty, 0));
  return (
    <Link href="/gio-hang" className="relative flex items-center gap-2 rounded-md border border-brand/20 px-3 py-2 font-bold text-brand hover:bg-brand-50">
      <ShoppingCart className="h-5 w-5" />
      <span className="hidden text-sm sm:inline">Giỏ hàng</span>
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-price px-1 text-xs font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
