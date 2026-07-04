"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/wishlist-store";

interface Props {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    salePrice: number | null;
    image: string | null;
  };
  className?: string;
}

export function WishlistButton({ product, className = "" }: Props) {
  const toggle = useWishlist((s) => s.toggle);
  const has = useWishlist((s) => s.has(product.id));

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(product);
      }}
      className={`flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-neutral-50 ${className}`}
      aria-label={has ? "Bỏ yêu thích" : "Thêm yêu thích"}
    >
      <Heart className={`h-4 w-4 ${has ? "fill-red-500 text-red-500" : "text-neutral-500"}`} />
      <span className="hidden sm:inline">{has ? "Đã thích" : "Yêu thích"}</span>
    </button>
  );
}
