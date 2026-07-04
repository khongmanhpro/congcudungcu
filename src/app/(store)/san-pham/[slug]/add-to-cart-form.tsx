"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-store";
import { ShoppingCart, Minus, Plus, Zap } from "lucide-react";

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

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <span className="text-sm font-semibold text-[#344054]">Số lượng:</span>
        <div className="flex w-44 items-center rounded border border-[#dce5f1] bg-white">
          <button
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="flex h-10 w-12 items-center justify-center text-[#667085] hover:bg-[#f0f6ff] hover:text-[#0757c9]"
            disabled={disabled}
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(Number(e.target.value), Math.max(1, product.stock))))}
            className="h-10 w-20 border-x border-[#dce5f1] text-center text-sm font-bold outline-none"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => setQty(Math.min(qty + 1, Math.max(1, product.stock)))}
            className="flex h-10 w-12 items-center justify-center text-[#0757c9] hover:bg-[#f0f6ff]"
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
          className="flex h-12 items-center justify-center gap-2 rounded border-2 border-[#0757c9] bg-white text-sm font-black uppercase text-[#0757c9] transition hover:bg-[#f0f6ff] disabled:cursor-not-allowed disabled:border-[#d0d5dd] disabled:text-[#98a2b3]"
        >
          <ShoppingCart className="h-4 w-4" />
          {added ? "Đã thêm!" : "Thêm vào giỏ"}
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={disabled}
          className="flex h-12 items-center justify-center gap-2 rounded bg-[#ff7417] text-sm font-black uppercase text-white transition hover:bg-[#e95f05] disabled:cursor-not-allowed disabled:bg-[#d0d5dd]"
        >
          <Zap className="h-4 w-4 fill-current" />
          Mua ngay
        </button>
      </div>
      {outOfStock && <p className="text-sm text-red-600">Sản phẩm hiện hết hàng.</p>}
      {missingPrice && <p className="text-sm text-[#ef233c]">Sản phẩm chưa có giá trong database. Vui lòng liên hệ để nhận báo giá.</p>}
    </div>
  );
}
