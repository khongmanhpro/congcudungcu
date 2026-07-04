"use client";

import Link from "next/link";
import { useWishlist } from "@/lib/wishlist-store";
import { useCart } from "@/lib/cart-store";
import { formatVND } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Heart, Trash2, ShoppingCart } from "lucide-react";

export default function WishlistPage() {
  const { items, remove, clear } = useWishlist();
  const add = useCart((s) => s.add);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Heart className="mx-auto mb-4 h-16 w-16 text-neutral-300" />
        <h1 className="mb-2 text-2xl font-bold">Danh sách yêu thích trống</h1>
        <p className="mb-6 text-muted-foreground">Bạn chưa thêm sản phẩm nào vào yêu thích.</p>
        <Button asChild><Link href="/san-pham">Khám phá sản phẩm</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Yêu thích ({items.length})</h1>
        <button onClick={clear} className="text-sm text-muted-foreground hover:text-red-600">Xóa tất cả</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col rounded-lg border bg-white p-4">
            <Link href={`/san-pham/${item.slug}`} className="group">
              <div className="aspect-square overflow-hidden rounded-md bg-neutral-100">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <h3 className="mt-2 line-clamp-2 text-sm font-medium group-hover:text-primary">{item.name}</h3>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-bold text-primary">{formatVND(item.salePrice ?? item.price)}</span>
                {item.salePrice && <span className="text-xs text-muted-foreground line-through">{formatVND(item.price)}</span>}
              </div>
            </Link>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => add({
                  id: item.id, name: item.name, slug: item.slug,
                  price: item.price, salePrice: item.salePrice,
                  image: item.image, stock: 99,
                })}
              >
                <ShoppingCart className="h-4 w-4" /> Thêm giỏ
              </Button>
              <Button size="icon" variant="outline" onClick={() => remove(item.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
