"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ShoppingCart, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart-store";
import { formatVND } from "@/lib/format";

interface QuickProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  stock: number;
  shortDesc: string | null;
  sku: string | null;
  image: string | null;
  brand: string | null;
  category: string | null;
}

export function QuickViewButton({ slug }: { slug: string }) {
  const [product, setProduct] = useState<QuickProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState(1);

  async function open(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setQty(1);
    try {
      const res = await fetch(`/api/products/quick-view?slug=${slug}`);
      if (res.ok) {
        const d = await res.json();
        setProduct(d);
      }
    } catch {}
    setLoading(false);
  }

  function close() {
    setProduct(null);
  }

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    if (product) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [product]);

  return (
    <>
      <button
        onClick={open}
        disabled={loading}
        className="absolute bottom-2 right-2 z-10 rounded-full bg-white/90 p-2 text-xs font-medium shadow hover:bg-white opacity-0 transition group-hover:opacity-100"
        aria-label="Xem nhanh"
      >
        {loading ? "..." : "Xem nhanh"}
      </button>

      {product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={close}>
          <div className="relative grid max-h-[90vh] w-full max-w-3xl gap-6 overflow-y-auto rounded-xl bg-white p-6 md:grid-cols-2" onClick={(e) => e.stopPropagation()}>
            <button onClick={close} className="absolute right-4 top-4 rounded-full p-1 hover:bg-neutral-100">
              <X className="h-5 w-5" />
            </button>

            {/* Image */}
            <div className="aspect-square overflow-hidden rounded-lg bg-neutral-100">
              {product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-400">No image</div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-3">
              <div>
                {product.brand && <Badge variant="secondary" className="mb-2">{product.brand}</Badge>}
                <h2 className="text-xl font-bold">{product.name}</h2>
                {product.sku && <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>}
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-primary">
                  {(product.salePrice && product.salePrice > 0 ? product.salePrice : product.price) > 0
                    ? formatVND(product.salePrice && product.salePrice > 0 ? product.salePrice : product.price)
                    : "Liên hệ"}
                </span>
                {product.salePrice && product.salePrice > 0 && product.salePrice < product.price && (
                  <span className="text-lg text-muted-foreground line-through">{formatVND(product.price)}</span>
                )}
              </div>

              <div>
                {product.stock > 0 ? (
                  <Badge variant="success">Còn hàng ({product.stock})</Badge>
                ) : (
                  <Badge variant="destructive">Hết hàng</Badge>
                )}
              </div>

              {product.shortDesc && <p className="text-sm text-neutral-700 line-clamp-3">{product.shortDesc}</p>}

              {/* Qty + Add to cart */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center border rounded-md">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-9 w-9 items-center justify-center hover:bg-neutral-100">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-sm">{qty}</span>
                  <button onClick={() => setQty(Math.min(qty + 1, Math.max(1, product.stock)))} className="flex h-9 w-9 items-center justify-center hover:bg-neutral-100">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <AddToCartBtn product={product} qty={qty} />
              </div>

              <Link href={`/san-pham/${product.slug}`} className="block pt-2 text-sm text-primary hover:underline">
                Xem chi tiết →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AddToCartBtn({ product, qty }: { product: QuickProduct; qty: number }) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock <= 0;
  const missingPrice = product.price <= 0;

  return (
    <Button
      onClick={() => {
        if (outOfStock || missingPrice) return;
        add({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          salePrice: product.salePrice,
          image: product.image,
          stock: product.stock,
        }, qty);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }}
      disabled={outOfStock || missingPrice}
    >
      <ShoppingCart className="h-4 w-4" />
      {missingPrice ? "Liên hệ" : added ? "Đã thêm!" : "Thêm vào giỏ"}
    </Button>
  );
}
