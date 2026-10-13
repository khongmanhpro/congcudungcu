"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-store";
import { FileText, ShoppingCart, Minus, Phone, Plus, Zap } from "lucide-react";

interface Props {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    salePrice: number | null;
    image: string | null;
    stock: number;
  };
}

export function AddToCartForm({ product }: Props) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const outOfStock = product.stock <= 0;
  const missingPrice = product.price <= 0;
  const disabled = outOfStock || missingPrice;

  function handleAdd() {
    if (disabled) return;
    add(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    if (disabled) return;
    add(product, qty);
    router.push("/gio-hang");
  }

  // Chưa có giá: thay luồng mua bằng yêu cầu báo giá
  if (missingPrice) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/lien-he"
          className="flex h-12 items-center justify-center gap-2 rounded bg-brand text-sm font-bold uppercase text-white transition hover:bg-brand-dark"
        >
          <FileText className="h-4 w-4" />
          Yêu cầu báo giá
        </Link>
        <a
          href="tel:0978390339"
          className="flex h-12 items-center justify-center gap-2 rounded bg-gold text-sm font-bold uppercase text-brand-dark transition hover:bg-gold-dark"
        >
          <Phone className="h-4 w-4" />
          Gọi tư vấn
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <span className="text-sm font-semibold text-[#344054]">Số lượng:</span>
        <div className="flex w-44 items-center rounded border border-[#dce5f1] bg-white">
          <button
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            aria-label="Giảm số lượng"
            className="flex h-10 w-12 items-center justify-center text-[#667085] hover:bg-brand-50 hover:text-brand"
            disabled={disabled}
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            aria-label="Số lượng"
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(Number(e.target.value), Math.max(1, product.stock))))}
            className="h-10 w-20 border-x border-[#dce5f1] text-center text-sm font-bold outline-none"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => setQty(Math.min(qty + 1, Math.max(1, product.stock)))}
            aria-label="Tăng số lượng"
            className="flex h-10 w-12 items-center justify-center text-brand hover:bg-brand-50"
            disabled={disabled}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled}
          className="flex h-12 items-center justify-center gap-2 rounded border-2 border-brand bg-white text-sm font-black uppercase text-brand transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:border-[#d0d5dd] disabled:text-[#98a2b3]"
        >
          <ShoppingCart className="h-4 w-4" />
          {added ? "Đã thêm!" : "Thêm vào giỏ"}
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={disabled}
          className="flex h-12 items-center justify-center gap-2 rounded bg-gold text-sm font-black uppercase text-brand-dark transition hover:bg-gold-dark disabled:cursor-not-allowed disabled:bg-[#d0d5dd] disabled:text-white"
        >
          <Zap className="h-4 w-4 fill-current" />
          Mua ngay
        </button>
      </div>
      {outOfStock && <p className="text-sm text-red-600">Sản phẩm hiện hết hàng.</p>}
    </div>
  );
}
