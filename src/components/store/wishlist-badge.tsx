"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/wishlist-store";

export function WishlistBadge() {
  const count = useWishlist((s) => s.items.length);

  return (
    <Link href="/yeu-thich" className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-neutral-100" aria-label="Yêu thích">
      <Heart className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
