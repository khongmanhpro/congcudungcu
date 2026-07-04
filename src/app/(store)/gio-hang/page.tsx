"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { formatVND } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";

export default function CartPage() {
  const { items, setQty, remove, total, clear } = useCart();
  const t = total();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-neutral-300" />
        <h1 className="mb-2 text-2xl font-bold">Giỏ hàng trống</h1>
        <p className="mb-6 text-muted-foreground">Bạn chưa có sản phẩm nào trong giỏ.</p>
        <Button asChild><Link href="/san-pham">Tiếp tục mua sắm</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">Giỏ hàng ({items.length} sản phẩm)</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3 rounded-lg border bg-white p-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col">
                <Link href={`/san-pham/${item.slug}`} className="font-medium hover:text-primary">{item.name}</Link>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-bold text-primary">{formatVND(item.salePrice ?? item.price)}</span>
                  {item.salePrice && <span className="text-xs text-muted-foreground line-through">{formatVND(item.price)}</span>}
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center border rounded-md">
                    <button onClick={() => setQty(item.id, item.qty - 1)} className="flex h-8 w-8 items-center justify-center hover:bg-neutral-100">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-10 text-center text-sm">{item.qty}</span>
                    <button onClick={() => setQty(item.id, item.qty + 1)} className="flex h-8 w-8 items-center justify-center hover:bg-neutral-100">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button onClick={() => remove(item.id)} className="flex items-center gap-1 text-sm text-red-600 hover:underline">
                    <Trash2 className="h-4 w-4" /> Xóa
                  </button>
                </div>
              </div>
              <div className="text-right font-bold">{formatVND((item.salePrice ?? item.price) * item.qty)}</div>
            </div>
          ))}
          <button onClick={clear} className="text-sm text-muted-foreground hover:text-red-600">Xóa toàn bộ giỏ hàng</button>
        </div>

        <div className="space-y-4 rounded-lg border bg-white p-5 h-fit">
          <h2 className="font-semibold">Tổng tiền</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Tạm tính</span><span>{formatVND(t)}</span></div>
            <div className="flex justify-between"><span>Phí ship</span><span className="text-muted-foreground">Tính ở bước thanh toán</span></div>
            <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Tổng</span><span className="text-primary">{formatVND(t)}</span></div>
          </div>
          <Button asChild className="w-full"><Link href="/thanh-toan">Tiến hành thanh toán</Link></Button>
          <Button asChild variant="outline" className="w-full"><Link href="/san-pham">Tiếp tục mua</Link></Button>
        </div>
      </div>
    </div>
  );
}
