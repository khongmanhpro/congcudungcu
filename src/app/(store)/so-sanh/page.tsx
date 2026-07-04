"use client";

import Link from "next/link";
import { useCompare } from "@/lib/compare-store";
import { formatVND } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { X, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-store";

export default function ComparePage() {
  const { items, remove, clear } = useCompare();
  const add = useCart((s) => s.add);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">So sánh sản phẩm</h1>
        <p className="mb-6 text-muted-foreground">Bạn chưa chọn sản phẩm nào để so sánh.</p>
        <Button asChild><Link href="/san-pham">Chọn sản phẩm</Link></Button>
      </div>
    );
  }

  // Tập hợp tất cả các nhãn thông số kỹ thuật duy nhất
  const allSpecLabels = Array.from(
    new Set(items.flatMap((i) => i.specs.map((s) => s.label))),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">So sánh sản phẩm ({items.length})</h1>
        <button onClick={clear} className="text-sm text-muted-foreground hover:text-red-600">Xóa tất cả</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-32 border-b bg-white p-3 text-left text-sm font-semibold text-muted-foreground">Tiêu chí</th>
              {items.map((p) => (
                <th key={p.id} className="border-b p-3 text-left align-top">
                  <div className="relative">
                    <button
                      onClick={() => remove(p.id)}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 hover:bg-red-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <Link href={`/san-pham/${p.slug}`} className="block">
                      <div className="aspect-square overflow-hidden rounded-md bg-neutral-100">
                        {p.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <h3 className="mt-2 line-clamp-2 text-sm font-medium hover:text-primary">{p.name}</h3>
                    </Link>
                    {p.brand && <p className="text-xs text-muted-foreground">{p.brand}</p>}
                    <div className="mt-1 font-bold text-primary">{formatVND(p.salePrice ?? p.price)}</div>
                    {p.salePrice && <div className="text-xs text-muted-foreground line-through">{formatVND(p.price)}</div>}
                    <Button
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => add({
                        id: p.id, name: p.name, slug: p.slug,
                        price: p.price, salePrice: p.salePrice,
                        image: p.image, stock: 99,
                      })}
                    >
                      <ShoppingCart className="h-4 w-4" /> Thêm giỏ
                    </Button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="sticky left-0 z-10 border-b bg-neutral-50 p-3 text-sm font-medium">Giá</td>
              {items.map((p) => (
                <td key={p.id} className="border-b p-3 text-sm font-bold text-primary">{formatVND(p.salePrice ?? p.price)}</td>
              ))}
            </tr>
            <tr>
              <td className="sticky left-0 z-10 border-b bg-neutral-50 p-3 text-sm font-medium">Thương hiệu</td>
              {items.map((p) => (
                <td key={p.id} className="border-b p-3 text-sm">{p.brand || "—"}</td>
              ))}
            </tr>
            {allSpecLabels.map((label) => (
              <tr key={label}>
                <td className="sticky left-0 z-10 border-b bg-neutral-50 p-3 text-sm font-medium">{label}</td>
                {items.map((p) => {
                  const spec = p.specs.find((s) => s.label === label);
                  return (
                    <td key={p.id} className="border-b p-3 text-sm">{spec?.value || "—"}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
