"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-store";

export function CartButton() {
  const count = useCart((s) => s.items.reduce((sum, i) => sum + i.qty, 0));
  return (
    <Link href="/gio-hang" className="relative flex items-center gap-2 rounded-md px-3 py-2 font-bold text-[#1d2939] hover:bg-[#f0f6ff]">
      <ShoppingCart className="h-6 w-6" />
      <span className="hidden text-sm sm:inline">Giỏ hàng</span>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff7417] px-1 text-xs font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
