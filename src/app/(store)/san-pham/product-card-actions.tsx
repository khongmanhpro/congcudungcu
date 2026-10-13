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
      className="grid h-8 w-8 place-items-center rounded-full text-[#94a3b8] transition hover:bg-[#fff1f1] hover:text-[#ef4444]"
      aria-label={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
    >
      <Heart className={`h-4 w-4 ${isFavorite ? "fill-[#ef4444] text-[#ef4444]" : ""}`} />
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
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-brand shadow-[0_0_0_4px_rgba(0,56,105,.06)] transition hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:bg-[#f1f5f9] disabled:text-[#94a3b8] disabled:shadow-none"
        aria-label={product.price <= 0 ? "Liên hệ báo giá" : added ? "Đã thêm vào giỏ" : "Thêm vào giỏ hàng"}
        title={product.price <= 0 ? "Liên hệ báo giá" : added ? "Đã thêm" : "Thêm vào giỏ"}
      >
        <ShoppingCart className="h-4 w-4" />
      </button>
  );
}
