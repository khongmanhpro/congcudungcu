import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatVND } from "@/lib/format";
import { AddToCartForm } from "./add-to-cart-form";
import { WishlistButton } from "@/components/store/wishlist-button";
import { CompareButton } from "@/components/store/compare-button";
import { ProductGallery } from "./product-gallery";
import { ProductDetailTabs } from "./product-detail-tabs";
import {
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Headphones,
  RotateCcw,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";

export const revalidate = 60;

type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  salePrice: number | null;
  stock: number;
  shortDesc: string | null;
  description: string;
  specs: { items?: { label: string; value: string }[] } | null;
  status: string;
  categoryId: string | null;
  images: { url: string; alt: string | null }[];
  category: { name: string; slug: string } | null;
  brand: { name: string } | null;
};

function cleanText(value: string | null | undefined) {
  return value
    ? value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    : undefined;
}

function normalizeProductHtml(html: string) {
  return html
    .replace(/https?:\/\/[^"'\s]+\/wp-content\/uploads\//g, "/uploads/")
    .replace(/\[caption[^\]]*\]/g, "")
    .replace(/\[\/caption\]/g, "");
}

async function getProduct(slug: string): Promise<ProductDetail | null> {
  try {
    return await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { position: "asc" } },
        category: true,
        brand: true,
      },
    }) as ProductDetail | null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Không tìm thấy sản phẩm" };
  return {
    title: product.name,
    description: cleanText(product.shortDesc),
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product || product.status !== "PUBLISHED") notFound();

  const related = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    take: 4,
    include: { images: { take: 1, orderBy: { position: "asc" } } },
  }).catch(() => []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDesc || undefined,
    sku: product.sku || undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
    image: product.images.map((i) => i.url),
    offers: {
      "@type": "Offer",
      price: product.salePrice && product.salePrice > 0 ? product.salePrice : product.price,
      priceCurrency: "VND",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
  const displayPrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
  const hasPrice = displayPrice > 0;
  const discount = product.salePrice && product.salePrice > 0 && product.price > product.salePrice
    ? Math.round((1 - product.salePrice / product.price) * 100)
    : null;
  const savings = product.salePrice && product.salePrice > 0 && product.price > product.salePrice ? product.price - product.salePrice : 0;
  const specsItems = (product.specs as { items?: { label: string; value: string }[] } | null)?.items || [];
  const featureChips = specsItems.slice(0, 4);
  const descriptionHtml = normalizeProductHtml(product.description || "");

  return (
    <div className="bg-[#f4f7fb] text-[#172033]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-6">
        <nav className="mb-4 flex flex-nowrap items-center gap-2 overflow-x-auto whitespace-nowrap text-xs text-[#667085] sm:mb-5 sm:flex-wrap sm:text-sm">
          <Link href="/" className="hover:text-[#0757c9]">Trang chủ</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/san-pham" className="hover:text-[#0757c9]">Sản phẩm</Link>
          {product.category && (
            <>
              <ChevronRight className="h-4 w-4" />
              <Link href={`/danh-muc/${product.category.slug}`} className="hover:text-[#0757c9]">{product.category.name}</Link>
            </>
          )}
          <ChevronRight className="h-4 w-4" />
          <span className="text-[#172033]">Chi tiết sản phẩm</span>
        </nav>

        <section className="grid gap-4 lg:grid-cols-[1.02fr_1.15fr] lg:gap-6">
          <ProductGallery images={product.images} name={product.name} discount={discount} />

          <div className="rounded-md border border-[#dce5f1] bg-white p-4 sm:p-5">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_270px]">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  {product.brand && <span className="text-lg font-black uppercase text-[#ef233c]">{product.brand.name}</span>}
                  {product.brand && <span className="text-sm text-[#667085]">Thương hiệu</span>}
                </div>
                <h1 className="text-xl font-black leading-tight text-[#172033] md:text-3xl">{product.name}</h1>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-[#ffae00]">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="h-4 w-4 fill-current" />
                    ))}
                  </span>
                  <span className="text-[#667085]">Đánh giá sản phẩm</span>
                  {product.sku && <span className="text-[#667085]">SKU: <strong className="text-[#344054]">{product.sku}</strong></span>}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                  {product.stock > 0 ? (
                    <span className="flex items-center gap-1.5 font-semibold text-[#16a34a]">
                      <CheckCircle2 className="h-4 w-4" /> Còn hàng
                    </span>
                  ) : (
                    <span className="font-semibold text-[#ef233c]">Hết hàng</span>
                  )}
                  {product.stock > 0 && <span className="text-[#667085]">Tồn kho: {product.stock} sản phẩm</span>}
                </div>

                {featureChips.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {featureChips.map((item) => (
                      <span key={`${item.label}-${item.value}`} className="rounded bg-[#f0f6ff] px-3 py-1.5 text-xs font-semibold text-[#344054]">
                        {item.value}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-6 border-t border-[#edf1f7] pt-5">
                  {product.salePrice && product.salePrice > 0 && <div className="text-sm text-[#667085] line-through">{formatVND(product.price)}</div>}
                  <div className="mt-1 text-3xl font-black text-[#ff1f00] sm:text-4xl">{hasPrice ? formatVND(displayPrice) : "Liên hệ"}</div>
                  <div className="mt-2 text-sm text-[#667085]">{hasPrice ? "Giá đã bao gồm VAT" : "Sản phẩm chưa có giá trong database"}</div>
                  {savings > 0 && (
                    <div className="mt-3 inline-flex rounded bg-[#fff1f1] px-3 py-1.5 text-sm font-semibold text-[#ef233c]">
                      Tiết kiệm: {formatVND(savings)} {discount ? `(${discount}%)` : ""}
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <AddToCartForm product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: product.price,
                    salePrice: product.salePrice,
                    image: product.images[0]?.url || null,
                    stock: product.stock,
                  }} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <WishlistButton product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: product.price,
                    salePrice: product.salePrice,
                    image: product.images[0]?.url || null,
                  }} className="justify-center border-0 px-0 text-[#344054] hover:bg-transparent hover:text-[#0757c9]" />
                  <CompareButton product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: product.price,
                    salePrice: product.salePrice,
                    image: product.images[0]?.url || null,
                    brand: product.brand?.name || null,
                    specs: specsItems,
                  }} className="justify-center border-0 px-0 text-[#344054] hover:bg-transparent hover:text-[#0757c9]" />
                </div>
              </div>

              <aside className="space-y-5 border-t border-[#edf1f7] pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
                {[
                  { icon: ShieldCheck, title: "100% Hàng chính hãng", desc: `Cam kết sản phẩm chính hãng${product.brand ? ` ${product.brand.name}` : ""}` },
                  { icon: BadgeCheck, title: "Bảo hành chính hãng", desc: "Hỗ trợ bảo hành toàn quốc" },
                  { icon: Truck, title: "Giao hàng toàn quốc", desc: "Giao nhanh, kiểm tra trước khi nhận" },
                  { icon: Headphones, title: "Hỗ trợ kỹ thuật 24/7", desc: "Tư vấn và hỗ trợ chuyên nghiệp" },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f0f6ff] text-[#0757c9]">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-[#172033]">{item.title}</div>
                      <div className="mt-1 text-xs leading-5 text-[#667085]">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </aside>
            </div>
          </div>
        </section>

        <section className="mt-5 border-y border-[#dce5f1] bg-white sm:mt-8">
          <div className="grid grid-cols-2 gap-4 py-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: "Cam kết chính hãng", desc: "100% sản phẩm chính hãng" },
              { icon: BadgeCheck, title: "Giá cạnh tranh", desc: "Giá tốt nhất thị trường" },
              { icon: Truck, title: "Giao hàng nhanh", desc: "Giao hàng toàn quốc" },
              { icon: RotateCcw, title: "Đổi trả dễ dàng", desc: "Đổi trả trong 7 ngày" },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3 sm:gap-4">
                <item.icon className="h-7 w-7 shrink-0 text-[#0757c9] sm:h-9 sm:w-9" />
                <div>
                  <div className="text-xs font-black uppercase text-[#0757c9] sm:text-sm">{item.title}</div>
                  <div className="text-xs text-[#667085]">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <ProductDetailTabs
          descriptionHtml={descriptionHtml}
          shortDesc={product.shortDesc}
          specsItems={specsItems}
          productId={product.id}
        />

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-6 sm:mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-black uppercase text-[#0757c9] sm:text-xl">Sản phẩm liên quan</h2>
            <Link href="/san-pham" className="text-sm font-bold text-[#0757c9] hover:underline">Xem tất cả →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {related.map((p) => (
              <RelatedProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

        <section className="mt-6 overflow-hidden rounded-md bg-[#063f96] text-white sm:mt-8">
          <div className="grid items-center gap-4 px-4 py-5 md:grid-cols-[1fr_auto_auto] md:px-5 md:py-6">
            <div>
              <h2 className="text-lg font-black uppercase sm:text-xl">Cần tư vấn chọn dụng cụ phù hợp?</h2>
              <p className="mt-1 text-sm text-white/80">Đội ngũ chuyên gia luôn sẵn sàng hỗ trợ bạn chọn đúng sản phẩm.</p>
            </div>
            <a href="tel:+84978390339" className="flex h-12 items-center justify-center rounded border border-white/30 px-6 text-sm font-black hover:bg-white/10">
              +84 978.39.03.39
            </a>
            <Link href="/lien-he" className="flex h-12 items-center justify-center rounded border border-white/30 px-6 text-sm font-black hover:bg-white/10">
              Gửi yêu cầu tư vấn
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function RelatedProductCard({
  product,
}: {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    salePrice: number | null;
    images: { url: string; alt?: string | null }[];
  };
}) {
  const displayPrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
  const hasPrice = displayPrice > 0;
  const discount = product.salePrice && product.salePrice > 0 && product.price > product.salePrice
    ? Math.round((1 - product.salePrice / product.price) * 100)
    : null;

  return (
    <Link href={`/san-pham/${product.slug}`} className="group relative rounded-md border border-[#dce5f1] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#0757c9] hover:shadow-lg">
      {discount ? (
        <span className="absolute left-3 top-3 z-10 rounded bg-[#ef233c] px-2 py-1 text-xs font-black text-white">-{discount}%</span>
      ) : null}
      <div className="aspect-square overflow-hidden rounded bg-white">
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.images[0].url} alt={product.images[0].alt || product.name} className="h-full w-full object-contain p-4 transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#f4f7fb] text-sm text-[#98a2b3]">No image</div>
        )}
      </div>
      <h3 className="mt-3 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-[#172033] group-hover:text-[#0757c9]">{product.name}</h3>
      <div className="mt-2 flex items-center gap-1 text-[#ffae00]">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} className="h-3.5 w-3.5 fill-current" />
        ))}
      </div>
      <div className="mt-3 text-lg font-black text-[#ff1f00]">{hasPrice ? formatVND(displayPrice) : "Liên hệ"}</div>
      {product.salePrice && product.salePrice > 0 ? <div className="text-xs text-[#98a2b3] line-through">{formatVND(product.price)}</div> : null}
    </Link>
  );
}
