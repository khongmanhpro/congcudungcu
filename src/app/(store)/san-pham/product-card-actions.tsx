"use client";

import { useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useWishlist } from "@/lib/wishlist-store";

type ActionProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  image: string | null;
  stock: number;
};

export function ProductWishlistButton({ product }: { product: ActionProduct }) {
  const toggleWishlist = useWishlist((state) => state.toggle);
  const isFavorite = useWishlist((state) => state.has(product.id));

  return (
    <button
      type="button"
      onClick={toggleWishlist.bind(null, {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        salePrice: product.salePrice,
        image: product.image,
      })}
      className="absolute right-2 top-2 z-20 grid h-8 w-8 place-items-center rounded-full bg-white text-[#98a2b3] shadow-sm transition hover:text-[#ef4444] sm:right-4 sm:top-4"
      aria-label={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
    >
      <Heart className={`h-5 w-5 ${isFavorite ? "fill-[#ef4444] text-[#ef4444]" : ""}`} />
    </button>
  );
}

export function ProductCartButton({ product }: { product: ActionProduct }) {
  const add = useCart((state) => state.add);
  const [added, setAdded] = useState(false);
  const unavailable = product.stock <= 0 || product.price <= 0;

  function handleAdd() {
    if (unavailable) return;
    add(product, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  return (
      <button
        type="button"
        onClick={handleAdd}
        disabled={unavailable}
        className="grid h-9 w-9 shrink-0 place-items-center rounded border border-[#0757c9] text-[#0757c9] transition hover:bg-[#0757c9] hover:text-white disabled:cursor-not-allowed disabled:border-[#d0d5dd] disabled:text-[#98a2b3] sm:h-10 sm:w-10"
        aria-label={product.price <= 0 ? "Liên hệ báo giá" : added ? "Đã thêm vào giỏ" : "Thêm vào giỏ hàng"}
        title={product.price <= 0 ? "Liên hệ báo giá" : added ? "Đã thêm" : "Thêm vào giỏ"}
      >
        <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
  );
}
