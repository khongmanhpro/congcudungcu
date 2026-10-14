import Link from "next/link";
import { Star } from "lucide-react";
import { formatVND } from "@/lib/format";
import type { ProductStats } from "@/lib/product-stats";
import { ProductCartButton, ProductWishlistButton } from "@/app/(store)/san-pham/product-card-actions";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  price: number;
  salePrice: number | null;
  stock: number;
  images: { url: string; alt: string | null }[];
  brand?: { name: string } | null;
  category?: { name: string } | null;
};

/** Thẻ sản phẩm dùng chung (trang chủ, danh sách, danh mục, liên quan). */
export function ProductCard({ product, stats }: { product: ProductCardData; stats?: ProductStats }) {
  const onSale = !!product.salePrice && product.salePrice > 0 && product.salePrice < product.price;
  const displayPrice = onSale ? product.salePrice! : product.price;
  const image = product.images[0];
  const href = `/san-pham/${product.slug}`;
  const inStock = product.stock > 0;

  const actionProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    salePrice: product.salePrice,
    image: image?.url ?? null,
    stock: product.stock,
  };

  return (
    <article className="group relative flex min-w-0 flex-col rounded-md border border-gold/70 bg-white p-2.5 transition hover:border-gold hover:shadow-[0_6px_18px_rgba(0,56,105,.12)]">
      <span
        className={`absolute right-2.5 top-2.5 z-10 h-2 w-2 rounded-full ${inStock ? "bg-[#16a34a]" : "bg-price"}`}
        title={inStock ? "Còn hàng" : "Hết hàng"}
      />
      <Link href={href} aria-label={image?.alt || product.name} prefetch={false} className="relative block aspect-square overflow-hidden rounded bg-white">
        {image ? (
          // figcaption sr-only: tên hiển thị ngay bên dưới thẻ rồi, không cần lặp lại trên giao diện —
          // chỉ để công cụ đọc ảnh có ngữ cảnh (không phải ảnh trang trí)
          <figure className="h-full w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt={image.alt || product.name} loading="lazy" width={400} height={400} className="h-full w-full object-contain transition duration-300 group-hover:scale-105" />
            <figcaption className="sr-only">{image.alt || product.name}</figcaption>
          </figure>
        ) : (
          <div className="flex h-full items-center justify-center bg-[#f5f6f8] text-xs text-[#98a2b3]">Chưa có ảnh</div>
        )}
      </Link>

      <p className="mt-2 truncate text-[11px] uppercase text-[#475569]">{product.sku || product.brand?.name || " "}</p>
      <Link href={href} title={product.name} prefetch={false} className="mt-1 line-clamp-3 min-h-[3.75rem] text-[15px] font-bold leading-5 text-[#0f172a] hover:text-brand">
        {product.name}
      </Link>

      <div className="mt-1.5 min-h-10 text-right">
        {displayPrice > 0 ? (
          <>
            <div className="text-sm font-bold text-price">{formatVND(displayPrice)}</div>
            {onSale && <div className="text-xs text-[#94a3b8] line-through">{formatVND(product.price)}</div>}
          </>
        ) : (
          <Link href="/lien-he" className="text-sm font-bold text-price hover:underline">Liên hệ</Link>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <span className="flex min-w-0 items-center gap-1 whitespace-nowrap text-xs text-[#475569] sm:text-[13px]">
          <Star className="h-3.5 w-3.5 shrink-0 fill-gold text-gold" />
          {stats?.rating ?? 0}
          <span className="text-[#94a3b8]">•</span>
          <span className="truncate">Đã bán {stats?.sold ?? 0}</span>
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <span className="hidden sm:block"><ProductWishlistButton product={actionProduct} /></span>
          <ProductCartButton product={actionProduct} />
        </div>
      </div>
    </article>
  );
}
