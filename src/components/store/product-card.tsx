import Link from "next/link";
import { formatVND } from "@/lib/format";
import { ProductCartButton, ProductWishlistButton } from "@/app/(store)/san-pham/product-card-actions";
import { QuickViewButton } from "./quick-view";

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

/** Thẻ sản phẩm dùng chung cho trang chủ, danh sách, danh mục, sản phẩm liên quan. */
export function ProductCard({ product }: { product: ProductCardData }) {
  const onSale = !!product.salePrice && product.salePrice > 0 && product.salePrice < product.price;
  const displayPrice = onSale ? product.salePrice! : product.price;
  const discount = onSale ? Math.round((1 - product.salePrice! / product.price) * 100) : 0;
  const image = product.images[0];
  const href = `/san-pham/${product.slug}`;

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
    <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-lg border border-[#e4e9f2] bg-white transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[0_10px_28px_rgba(0,56,105,.12)]">
      <ProductWishlistButton product={actionProduct} />
      {discount > 0 && (
        <span className="absolute left-2 top-2 z-10 rounded bg-price px-1.5 py-0.5 text-[11px] font-bold text-white">-{discount}%</span>
      )}

      <Link href={href} className="relative block aspect-square bg-white">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.alt || product.name}
            loading="lazy"
            className="h-full w-full object-contain p-3 transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-brand-50 text-xs text-[#98a2b3]">Chưa có ảnh</div>
        )}
        <QuickViewButton slug={product.slug} />
      </Link>

      <div className="flex flex-1 flex-col border-t border-[#f0f2f6] px-3 pb-3 pt-2.5">
        <p className="line-clamp-1 text-[11px] font-semibold uppercase tracking-wide text-gold-dark">
          {product.brand?.name || product.category?.name || " "}
        </p>
        <Link
          href={href}
          className="mt-1 line-clamp-2 min-h-10 text-[13px] font-bold leading-5 text-[#1d2939] group-hover:text-brand"
          title={product.name}
        >
          {product.name}
        </Link>
        {product.sku && <p className="mt-1 text-[11px] text-[#667085]">Mã: {product.sku}</p>}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0">
            {displayPrice > 0 ? (
              <>
                <div className="text-[15px] font-bold leading-5 text-price">{formatVND(displayPrice)}</div>
                {onSale && <div className="text-[11px] text-[#98a2b3] line-through">{formatVND(product.price)}</div>}
              </>
            ) : (
              <Link href="/lien-he" className="text-[15px] font-bold text-price hover:underline">
                Liên hệ
              </Link>
            )}
          </div>
          <ProductCartButton product={actionProduct} />
        </div>
      </div>
    </article>
  );
}
