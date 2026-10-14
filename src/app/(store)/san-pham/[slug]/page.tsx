import Link from "next/link";
import { ProductCard } from "@/components/store/product-card";
import { getProductStats } from "@/lib/product-stats";
import { brandPath, categoryPath } from "@/lib/urls";
import { faqJsonLd, parseFaq } from "@/components/store/faq-section";

/** Phí giao hàng cố định — khớp shippingFee trong src/app/api/checkout/route.ts */
const SHIPPING_FEE = 30000;
import { redirectIfMoved } from "@/lib/redirects";
import { readSpecs } from "@/lib/specs";
import { JsonLd, absoluteUrl, breadcrumbJsonLd, getSiteUrl, toMetaDescription } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatVND, formatVNDRange } from "@/lib/format";
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

// Không có generateStaticParams → Next coi route này là Dynamic hoàn toàn (SSR mỗi request,
// Cache-Control: private, no-store), revalidate ở trên vô hiệu lực. Trả mảng rỗng để bật ISR
// "on-demand" (dynamicParams mặc định true): request đầu tiên render động rồi CACHE theo revalidate,
// không pre-build sẵn 3.000+ trang lúc build (sẽ làm chậm docker build).
export async function generateStaticParams() {
  return [];
}

type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  salePrice: number | null;
  priceMin: number | null;
  priceMax: number | null;
  stock: number;
  shortDesc: string | null;
  description: string;
  specs: { items?: { label: string; value: string }[] } | null;
  status: string;
  categoryId: string | null;
  images: { url: string; alt: string | null }[];
  category: { name: string; slug: string; parent: { name: string; slug: string } | null } | null;
  brand: { id: string; name: string; slug: string } | null;
  brandId: string | null;
  model: string | null;
  gtin: string | null;
  origin: string | null;
  seoTitle: string | null;
  seoDesc: string | null;
  faq: unknown;
};

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
        category: { include: { parent: { select: { name: true, slug: true } } } },
        brand: true,
      },
    }) as ProductDetail | null;
  } catch {
    return null;
  }
}

/** Mô tả meta: ưu tiên mô tả ngắn → mô tả dài → câu tự sinh từ tên/thương hiệu/mã. */
function productDescription(product: ProductDetail) {
  return (
    toMetaDescription(product.seoDesc) ||
    toMetaDescription(product.shortDesc) ||
    toMetaDescription(product.description) ||
    toMetaDescription(
      `Mua ${product.name}${product.brand ? ` chính hãng ${product.brand.name}` : " chính hãng"}${product.sku ? `, mã ${product.sku}` : ""}. Giá tốt, có hóa đơn VAT, giao hàng toàn quốc tại congcudungcu.vn.`,
    )
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product || product.status !== "PUBLISHED") return { title: "Không tìm thấy sản phẩm", robots: { index: false, follow: true } };
  const description = productDescription(product);
  const path = `/san-pham/${product.slug}`;
  const images = product.images.slice(0, 4).map((image) => ({ url: absoluteUrl(image.url), alt: image.alt || product.name }));
  const title = product.seoTitle || product.name;
  return {
    // Tiêu đề dài (>55 ký tự) thì bỏ hậu tố "| congcudungcu.vn" để Google không cắt mất phần quan trọng
    title: title.length > 55 ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", url: path, title, description, images, locale: "vi_VN" },
    twitter: { card: "summary_large_image", title, description, images: images.map((image) => image.url) },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product || product.status !== "PUBLISHED") {
    await redirectIfMoved(`/san-pham/${slug}`);
    notFound();
  }

  const cardInclude = { images: { take: 1, orderBy: { position: "asc" as const } }, brand: { select: { name: true } } };
  const [related, sameBrand] = await Promise.all([
    prisma.product.findMany({
      where: { status: "PUBLISHED", categoryId: product.categoryId, id: { not: product.id } },
      take: 6,
      include: cardInclude,
      orderBy: [{ featured: "desc" }, { publishedAt: { sort: "desc", nulls: "last" } }, { id: "asc" }],
    }).catch(() => []),
    product.brandId
      ? prisma.product.findMany({
          where: { status: "PUBLISHED", brandId: product.brandId, id: { not: product.id }, categoryId: { not: product.categoryId } },
          take: 6,
          include: cardInclude,
          orderBy: [{ featured: "desc" }, { publishedAt: { sort: "desc", nulls: "last" } }, { id: "asc" }],
        }).catch(() => [])
      : Promise.resolve([]),
  ]);
  const faq = parseFaq(product.faq);
  // Tên hiển thị công khai (H1, JSON-LD, breadcrumb): ưu tiên seoTitle đã viết chuẩn AEO
  // (ngắn gọn, có thương hiệu + mã ở đầu). Product.name gốc giữ nguyên cho giỏ hàng/đơn hàng/admin.
  const displayName = product.seoTitle || product.name;

  const stats = await getProductStats([product.id, ...related.map((p) => p.id), ...sameBrand.map((p) => p.id)]);
  const own = stats.get(product.id);
  const productUrl = absoluteUrl(`/san-pham/${product.slug}`);
  const specsForLd = readSpecs(product.specs).slice(0, 20);
  const offerPrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
  const hasPriceRange = offerPrice <= 0 && !!product.priceMin && !!product.priceMax;
  // theo chính sách đang công bố: phí ship cố định (api/checkout), giao 2–5 ngày, đổi trả 7 ngày
  const offerPolicyLd = {
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingRate: { "@type": "MonetaryAmount", value: SHIPPING_FEE, currency: "VND" },
      shippingDestination: { "@type": "DefinedRegion", addressCountry: "VN" },
      deliveryTime: {
        "@type": "ShippingDeliveryTime",
        handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
        transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 5, unitCode: "DAY" },
      },
    },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "VN",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 7,
      returnMethod: "https://schema.org/ReturnByMail",
    },
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: displayName,
    url: productUrl,
    description: productDescription(product),
    sku: product.sku || product.model || undefined,
    mpn: product.model || product.sku || undefined,
    gtin: product.gtin || undefined,
    countryOfOrigin: product.origin || undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand.name, url: absoluteUrl(brandPath(product.brand.slug)) } : undefined,
    category: product.category?.name,
    image: product.images.map((i) => absoluteUrl(i.url)),
    additionalProperty: specsForLd.length
      ? specsForLd.map((item) => ({ "@type": "PropertyValue", name: item.label, value: item.value }))
      : undefined,
    // Sản phẩm "Liên hệ" (giá 0, không có khoảng giá) không khai báo Offer để Google không hiển thị "0 ₫"
    offers:
      offerPrice > 0
        ? {
            "@type": "Offer",
            url: productUrl,
            price: offerPrice,
            priceCurrency: "VND",
            itemCondition: "https://schema.org/NewCondition",
            availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            seller: { "@id": `${getSiteUrl()}/#organization` },
            ...offerPolicyLd,
          }
        : hasPriceRange
          ? {
              // Giá bị khoá do chính sách đại lý/MAP — chỉ công bố khoảng giá khảo sát, giá thật qua liên hệ
              "@type": "AggregateOffer",
              url: productUrl,
              lowPrice: product.priceMin,
              highPrice: product.priceMax,
              priceCurrency: "VND",
              offerCount: 1,
              availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              seller: { "@id": `${getSiteUrl()}/#organization` },
              ...offerPolicyLd,
            }
          : undefined,
    aggregateRating:
      own && own.reviewCount > 0
        ? { "@type": "AggregateRating", ratingValue: own.rating, reviewCount: own.reviewCount, bestRating: 5, worstRating: 1 }
        : undefined,
  };
  const faqLd = faq.length ? [faqJsonLd(faq)] : [];
  const breadcrumb = breadcrumbJsonLd([
    { name: "Trang chủ", path: "/" },
    { name: "Sản phẩm", path: "/san-pham" },
    ...(product.category?.parent ? [{ name: product.category.parent.name, path: categoryPath({ slug: product.category.parent.slug }) }] : []),
    ...(product.category ? [{ name: product.category.name, path: categoryPath(product.category) }] : []),
    { name: displayName, path: `/san-pham/${product.slug}` },
  ]);
  const displayPrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
  const hasPrice = displayPrice > 0;
  const discount = product.salePrice && product.salePrice > 0 && product.price > product.salePrice
    ? Math.round((1 - product.salePrice / product.price) * 100)
    : null;
  const savings = product.salePrice && product.salePrice > 0 && product.price > product.salePrice ? product.price - product.salePrice : 0;
  const specsItems = readSpecs(product.specs);
  const featureChips = specsItems.slice(0, 4);
  const descriptionHtml = normalizeProductHtml(product.description || "");

  return (
    <div className="bg-[#f4f7fb] text-[#172033]">
      <JsonLd data={[jsonLd, breadcrumb, ...faqLd]} />

      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-6">
        <nav className="mb-4 flex flex-nowrap items-center gap-2 overflow-x-auto whitespace-nowrap text-xs text-[#667085] sm:mb-5 sm:flex-wrap sm:text-sm">
          <Link href="/" className="hover:text-brand">Trang chủ</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/san-pham" className="hover:text-brand">Sản phẩm</Link>
          {product.category && (
            <>
              <ChevronRight className="h-4 w-4" />
              <Link href={categoryPath(product.category)} className="hover:text-brand">{product.category.name}</Link>
            </>
          )}
          <ChevronRight className="h-4 w-4" />
          <span className="truncate text-[#172033]">{displayName}</span>
        </nav>

        <section className="grid gap-4 lg:grid-cols-[1.02fr_1.15fr] lg:gap-6">
          <ProductGallery images={product.images} name={displayName} discount={discount} />

          <div className="rounded-md border border-[#dce5f1] bg-white p-4 sm:p-5">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_270px]">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  {product.brand && (
                    <Link href={brandPath(product.brand.slug)} className="text-lg font-black uppercase text-price hover:underline">{product.brand.name}</Link>
                  )}
                  {product.brand && <span className="text-sm text-[#667085]">Thương hiệu</span>}
                  {product.origin && <span className="text-sm text-[#667085]">· Xuất xứ: {product.origin}</span>}
                </div>
                <h1 className="text-xl font-bold leading-snug text-[#172033] md:text-2xl">{displayName}</h1>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-[#475569]">
                    <Star className="h-4 w-4 fill-gold text-gold" />
                    {own && own.reviewCount > 0 ? `${own.rating} (${own.reviewCount} đánh giá)` : "Chưa có đánh giá"}
                  </span>
                  <span className="text-[#475569]">Đã bán {own?.sold ?? 0}</span>
                  {product.sku && <span className="text-[#667085]">SKU: <strong className="text-[#344054]">{product.sku}</strong></span>}
                  {product.model && product.model !== product.sku && <span className="text-[#667085]">Model: <strong className="text-[#344054]">{product.model}</strong></span>}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                  {product.stock > 0 ? (
                    <span className="flex items-center gap-1.5 font-semibold text-[#15803d]">
                      <CheckCircle2 className="h-4 w-4" /> Còn hàng
                    </span>
                  ) : (
                    <span className="font-semibold text-price">Hết hàng</span>
                  )}
                  {product.stock > 0 && <span className="text-[#667085]">Tồn kho: {product.stock} sản phẩm</span>}
                </div>

                {featureChips.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {featureChips.map((item) => (
                      <span key={`${item.label}-${item.value}`} className="rounded bg-brand-50 px-3 py-1.5 text-xs font-semibold text-[#344054]">
                        {item.value}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-6 border-t border-[#edf1f7] pt-5">
                  {product.salePrice && product.salePrice > 0 && <div className="text-sm text-[#667085] line-through">{formatVND(product.price)}</div>}
                  <div className={`mt-1 font-black text-price ${hasPrice ? "text-3xl sm:text-4xl" : hasPriceRange ? "text-xl sm:text-2xl" : "text-3xl sm:text-4xl"}`}>
                    {hasPrice ? formatVND(displayPrice) : hasPriceRange ? formatVNDRange(product.priceMin!, product.priceMax!) : "Liên hệ"}
                  </div>
                  <div className="mt-2 text-sm text-[#667085]">{hasPrice ? "Giá đã bao gồm VAT" : "Liên hệ để nhận báo giá tốt nhất"}</div>
                  {savings > 0 && (
                    <div className="mt-3 inline-flex rounded bg-[#fff1f1] px-3 py-1.5 text-sm font-semibold text-price">
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
                  }} className="justify-center border-0 px-0 text-[#344054] hover:bg-transparent hover:text-brand" />
                  <CompareButton product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: product.price,
                    salePrice: product.salePrice,
                    image: product.images[0]?.url || null,
                    brand: product.brand?.name || null,
                    specs: specsItems,
                  }} className="justify-center border-0 px-0 text-[#344054] hover:bg-transparent hover:text-brand" />
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
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand">
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
                <item.icon className="h-7 w-7 shrink-0 text-brand sm:h-9 sm:w-9" />
                <div>
                  <div className="text-xs font-black uppercase text-brand sm:text-sm">{item.title}</div>
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
          faq={faq}
        />

      {/* Cùng danh mục */}
      {related.length > 0 && (
        <section className="mt-6 sm:mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-black uppercase text-brand sm:text-xl">
              {product.category ? `${product.category.name} khác` : "Sản phẩm liên quan"}
            </h2>
            <Link href={product.category ? categoryPath(product.category) : "/san-pham"} className="text-sm font-bold text-brand hover:underline">Xem tất cả →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} stats={stats.get(p.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Cùng thương hiệu (khác danh mục) — liên kết nội bộ tới trang hãng */}
      {product.brand && sameBrand.length > 0 && (
        <section className="mt-6 sm:mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-black uppercase text-brand sm:text-xl">Sản phẩm {product.brand.name} khác</h2>
            <Link href={brandPath(product.brand.slug)} className="text-sm font-bold text-brand hover:underline">Tất cả {product.brand.name} →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {sameBrand.map((p) => (
              <ProductCard key={p.id} product={p} stats={stats.get(p.id)} />
            ))}
          </div>
        </section>
      )}

        <section className="mt-6 overflow-hidden rounded-md bg-brand-dark text-white sm:mt-8">
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
