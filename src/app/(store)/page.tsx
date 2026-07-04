import Link from "next/link";
import {
  ArrowRight,
  Award,
  ChevronRight,
  Gauge,
  Hammer,
  Headphones,
  Heart,
  Package,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Star,
  ThumbsUp,
  Truck,
  Wrench,
  Zap,
} from "lucide-react";
import { QuickViewButton } from "@/components/store/quick-view";
import { formatVND } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

const fallbackCategories = [
  "Công Cụ, Dụng Cụ",
  "Đồ Bảo Hộ Lao Động",
  "Dụng Cụ Điện",
  "Dụng Cụ Dùng Xăng",
  "Dụng Cụ Khí Nén",
  "Máy Hàn & Phụ Kiện",
  "Máy Khoan - Máy Vặn Vít",
  "Máy Mài & Máy Cắt",
  "Máy Cơ Khí",
  "Phụ Tùng & Linh Kiện",
  "Thiết Bị Điện",
  "Thiết Bị Đo Lường",
  "Thiết Bị Nâng Hạ",
  "Thiết Bị Làm Mát",
  "Thước Đo Laser",
  "Thương hiệu",
];

const catalogLabels = [
  "Công Cụ, Dụng Cụ",
  "Đồ Bảo Hộ Lao Động",
  "Dụng Cụ Điện",
  "Dụng Cụ Dùng Xăng",
  "Dụng Cụ Khí Nén",
  "Máy Hàn & Phụ Kiện",
  "Máy Khoan - Máy Vặn Vít",
  "Máy Mài & Máy Cắt",
  "Máy Cơ Khí",
  "Phụ Tùng & Linh Kiện",
  "Thiết Bị Điện",
  "Thiết Bị Đo Lường",
];

const categoryIcons = [Wrench, ShieldCheck, Zap, Gauge, Package, Hammer];

const categoryTiles = [
  { label: "Công Cụ, Dụng Cụ", image: "/uploads/2021/12/TOP-5-BO-Dung-Cu-Ban-Chay-Nhat-Hien-Nay-300x300.jpg", href: "/san-pham" },
  { label: "Dụng Cụ Điện", image: "/uploads/2021/12/Cac-Loi-Thuong-Gap-o-May-Khoan-dong-Luc-300x300.jpg", href: "/san-pham" },
  { label: "Dụng Cụ Khí Nén", image: "/uploads/2026/06/bua-cao-su-wokin-251608-251632.jpg", href: "/san-pham" },
  { label: "Máy Hàn & Phụ Kiện", image: "/uploads/2021/12/May-Han-Que-Ban-Chay-Nhat-Binh-Duong-300x300.jpg", href: "/san-pham" },
  { label: "Máy Khoan - Vặn Vít", image: "/uploads/2021/12/Cac-Loi-Thuong-Gap-o-May-Khoan-dong-Luc-400x400.jpg", href: "/san-pham" },
  { label: "Máy Mài - Máy Cắt", image: "/uploads/2021/12/Co-Nen-Mua-Bo-Dung-Cu-Da-Nang-Hay-Khong-300x300.jpg", href: "/san-pham" },
  { label: "Dụng Cụ Dùng Xăng", image: "/uploads/2026/06/pa-lang-cap-dien-wokin-738012-738002.jpg", href: "/san-pham" },
  { label: "Đồ Bảo Hộ Lao Động", image: "/uploads/2021/12/Thang-Ghe-Yumita-6-Bac-Khung-Inox-YMS-006-300x300.jpg", href: "/san-pham" },
  { label: "Thiết Bị Đo Lường", image: "/uploads/2026/06/chan-ke-o-to-wokin-736802-736806.jpg", href: "/san-pham" },
  { label: "Phụ Tùng & Linh Kiện", image: "/uploads/2026/06/cao-2-chau-wokin-731403-731408.jpg", href: "/san-pham" },
];

const brandTiles = ["BOSCH", "Makita", "DeWALT", "STANLEY", "Milwaukee", "HITACHI", "DCA"];

export default async function HomePage() {
  const [featured, newArrivals, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where: { status: "PUBLISHED", featured: true },
      take: 10,
      include: { images: { take: 1, orderBy: { position: "asc" } }, brand: true },
      orderBy: { updatedAt: "desc" },
    }).catch(() => []),
    prisma.product.findMany({
      where: { status: "PUBLISHED" },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { images: { take: 1, orderBy: { position: "asc" } }, brand: true },
    }).catch(() => []),
    prisma.category.findMany({
      where: { type: "PRODUCT", parentId: null },
      take: 12,
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    }).catch(() => []),
    prisma.brand.findMany({
      take: 8,
      orderBy: { name: "asc" },
    }).catch(() => []),
  ]);

  const allProducts = uniqueProducts([...featured, ...newArrivals]);
  const visualProducts = allProducts;
  const heroProducts = visualProducts.slice(0, 4);
  const categoryMenu = categories.length > 0 ? categories : fallbackCategories.map((name, index) => ({
    id: `fallback-${index}`,
    name,
    slug: "san-pham",
    imageUrl: null,
    _count: { products: 0 },
  }));
  const productRows = allProducts.slice(0, 5);
  const bestSellers = allProducts.slice(5, 10);

  return (
    <div className="overflow-x-hidden bg-[#f4f7fb] pb-3 text-[#101828]">
      <div className="mx-auto max-w-7xl px-3 pb-4 pt-0 sm:px-4">
        <div className="grid min-w-0 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden overflow-hidden rounded-b-md border border-t-0 border-[#dce5f1] bg-white shadow-sm lg:block">
            <div className="divide-y divide-[#edf1f7]">
              {categoryMenu.slice(0, 15).map((category, index) => {
                const Icon = categoryIcons[index % categoryIcons.length];
                const href = category.id.startsWith("fallback") ? "/san-pham" : `/danh-muc/${category.slug}`;
                const label = catalogLabels[index] ?? category.name;
                return (
                  <Link
                    key={category.id}
                    href={href}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#253044] transition hover:bg-[#f0f6ff] hover:text-[#0757c9]"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-[#667085]" />
                    <span className="line-clamp-1 flex-1">{label}</span>
                    <ChevronRight className="h-4 w-4 text-[#98a2b3]" />
                  </Link>
                );
              })}
            </div>
          </aside>

          <div className="min-w-0 space-y-4">
            <section className="relative min-h-[360px] overflow-hidden rounded-md bg-[#003b91] text-white shadow-sm md:min-h-[430px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_35%,rgba(76,181,255,0.6),transparent_24%),linear-gradient(110deg,#063579_0%,#064cae_48%,#0075df_100%)]" />
              <div className="absolute inset-y-0 right-0 w-2/3 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:42px_42px]" />
              <div className="relative grid min-h-[360px] items-center gap-8 px-5 py-8 md:min-h-[430px] md:grid-cols-[1fr_1.05fr] md:px-11 md:py-10">
                <div>
                  <p className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-[#9fd3ff]">Thiết Bị Công Nghiệp Chính Hãng 2026</p>
                  <h1 className="text-3xl font-black leading-tight sm:text-5xl">
                    Công cụ chất lượng
                    <span className="mt-1 block text-[#ff7a1a]">hiệu suất vượt trội</span>
                  </h1>
                  <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-white/95 sm:mt-5 sm:text-base">
                    Đầy đủ chủng loại - Chính hãng 100% - Giá tốt nhất cho xưởng, nhà thầu và đội bảo trì.
                  </p>
                  <div className="mt-6 grid max-w-xl gap-3 border-t border-white/20 pt-5 sm:grid-cols-3">
                    {[
                      { icon: ShieldCheck, label: "Chính hãng 100%" },
                      { icon: Truck, label: "Giao hàng nhanh" },
                      { icon: Award, label: "Bảo hành uy tín" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2 text-xs font-semibold text-white/90">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/35 bg-white/10">
                          <item.icon className="h-5 w-5" />
                        </span>
                        {item.label}
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/san-pham"
                    className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#ff7417] px-5 py-3 text-sm font-black uppercase text-white shadow-[0_12px_30px_rgba(255,116,23,.35)] transition hover:bg-[#ff6500] sm:mt-8 sm:px-7"
                  >
                    Khám phá ngay
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="relative hidden min-h-[330px] md:block">
                  <div className="absolute bottom-2 right-4 h-28 w-[78%] rounded-[50%] border border-[#57c6ff]/60 bg-[#0d68d4] shadow-[0_0_70px_rgba(97,205,255,.55)]" />
                  {heroProducts.map((product, index) => (
                    <HeroProduct key={product.id} product={product} index={index} />
                  ))}
                  {heroProducts.length === 0 && (
                    <div className="absolute bottom-16 right-10 flex h-52 w-72 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-center text-sm font-semibold text-white/70">
                      Dụng cụ nổi bật
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-3 rounded-md border border-[#dce5f1] bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: ShieldCheck, title: "Cam kết chính hãng", desc: "100% chính hãng" },
                { icon: Truck, title: "Giao hàng toàn quốc", desc: "Nhanh chóng - An toàn" },
                { icon: Gauge, title: "Giá cả cạnh tranh", desc: "Tối ưu chi phí cho bạn" },
                { icon: Headphones, title: "Hỗ trợ kỹ thuật 24/7", desc: "Tư vấn tận tâm" },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eaf3ff] text-[#0757c9]">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-xs font-black uppercase text-[#1d2939]">{item.title}</h3>
                    <p className="text-xs text-[#667085]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </section>
          </div>
        </div>

        <SectionShell title="Danh mục nổi bật" href="/san-pham" className="mt-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categoryTiles.map((category) => (
                <CategoryCard
                  key={category.label}
                  category={category}
                  label={category.label}
                  href={category.href}
                />
            ))}
          </div>
        </SectionShell>

        {productRows.length > 0 && (
          <SectionShell title="Sản phẩm nổi bật" href="/san-pham" className="mt-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {productRows.map((product, index) => (
                <ProductCard key={product.id} product={product} badge={index === 0 ? "-12%" : undefined} />
              ))}
            </div>
          </SectionShell>
        )}

        {bestSellers.length > 0 && (
          <SectionShell title="Sản phẩm bán chạy" href="/san-pham?sort=popular" className="mt-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {bestSellers.map((product, index) => (
                <ProductCard key={product.id} product={product} rank={index + 1} compact />
              ))}
            </div>
          </SectionShell>
        )}

        <section className="mt-5 rounded-md border border-[#dce5f1] bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-xl font-black uppercase text-[#1d2939]">Thương hiệu nổi bật</h2>
            <div className="grid grid-cols-2 overflow-hidden rounded-md border border-[#e4e9f2] sm:grid-cols-4 lg:grid-cols-8">
              {(brands.length > 0 ? brands.slice(0, 8).map((brand) => brand.name) : brandTiles).map((brand) => (
                <Link
                  key={brand}
                  href="/san-pham"
                  className="flex min-h-16 items-center justify-center border-b border-r border-[#e4e9f2] bg-white px-3 text-center text-lg font-black uppercase text-[#344054] transition hover:bg-[#f5f9ff] hover:text-[#0757c9]"
                >
                  {brand}
                </Link>
              ))}
            </div>
          </section>

        <section className="mt-5 grid grid-cols-2 gap-4 rounded-md bg-[#0757c9] px-4 py-5 text-white shadow-sm sm:grid-cols-2 sm:px-6 sm:py-6 lg:grid-cols-4">
          {[
            { icon: Package, number: "10.000+", label: "Sản phẩm đa dạng" },
            { icon: Headphones, number: "5.000+", label: "Khách hàng tin tưởng" },
            { icon: ThumbsUp, number: "98%", label: "Đánh giá hài lòng" },
            { icon: RotateCcw, number: "7 ngày", label: "Đổi trả miễn phí" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 sm:gap-4">
              <stat.icon className="h-7 w-7 shrink-0 text-[#9fd3ff] sm:h-9 sm:w-9" />
              <div>
                <div className="text-lg font-black sm:text-2xl">{stat.number}</div>
                <div className="text-xs text-white/85 sm:text-sm">{stat.label}</div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function SectionShell({
  title,
  href,
  className = "",
  children,
}: {
  title: string;
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`min-w-0 rounded-md border border-[#dce5f1] bg-white p-3 shadow-sm sm:p-4 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="border-l-4 border-[#0757c9] pl-3 text-base font-black uppercase text-[#1d2939] sm:pl-4 sm:text-xl">{title}</h2>
        <Link href={href} className="inline-flex items-center gap-1 text-xs font-bold text-[#0757c9] hover:text-[#ff7417]">
          Xem tất cả
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {children}
    </section>
  );
}

function CategoryCard({
  category,
  href,
  label,
}: {
  category: { label: string; image: string; href: string };
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-28 min-w-0 flex-col items-center justify-center rounded-md border border-[#e4e9f2] bg-white p-2 text-center transition hover:border-[#0757c9] hover:shadow-md sm:min-h-32 sm:p-3"
    >
      <div className="mb-2 flex h-14 w-20 items-center justify-center sm:mb-3 sm:h-16 sm:w-24">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={category.image} alt={label} className="max-h-14 max-w-20 object-contain transition group-hover:scale-105 sm:max-h-16 sm:max-w-24" />
      </div>
      <span className="line-clamp-2 text-xs font-bold leading-4 text-[#1d2939] group-hover:text-[#0757c9] sm:text-sm">{label}</span>
    </Link>
  );
}

function uniqueProducts<T extends { id: string }>(products: T[]) {
  return Array.from(new Map(products.map((product) => [product.id, product])).values());
}

function HeroProduct({
  product,
  index,
}: {
  product: { name: string; images: { url: string; alt: string | null }[] };
  index: number;
}) {
  const positions = [
    "right-2 top-8 h-52 w-52",
    "right-52 top-24 h-44 w-44",
    "right-28 bottom-4 h-40 w-40",
    "right-72 bottom-12 h-32 w-32",
  ];

  if (!product.images[0]) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={product.images[0].url}
      alt={product.images[0].alt || product.name}
      className={`absolute object-contain drop-shadow-[0_22px_22px_rgba(0,16,56,.48)] ${positions[index] || positions[0]}`}
    />
  );
}

function ProductCard({
  product,
  badge,
  rank,
  compact = false,
}: {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    salePrice: number | null;
    images: { url: string; alt: string | null }[];
    brand?: { name: string } | null;
  };
  badge?: string;
  rank?: number;
  compact?: boolean;
}) {
  const price = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
  const hasPrice = price > 0;
  const onSale = product.salePrice && product.salePrice > 0 && product.salePrice < product.price;

  return (
    <Link
      href={`/san-pham/${product.slug}`}
      className="group relative flex min-h-full min-w-0 flex-col rounded-md border border-[#e4e9f2] bg-white p-2 transition hover:border-[#0757c9] hover:shadow-md sm:p-3"
    >
      <div className="relative aspect-square overflow-hidden rounded-md bg-[#f8fafc]">
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0].url}
            alt={product.images[0].alt || product.name}
            className="h-full w-full object-contain p-2 transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#98a2b3]">No image</div>
        )}
        {(badge || rank) && (
          <span className="absolute left-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-[#ffae00] px-2 text-xs font-black text-white">
            {rank ?? badge}
          </span>
        )}
        {onSale && !badge && !rank && (
          <span className="absolute left-2 top-2 rounded bg-[#ff7417] px-2 py-1 text-xs font-black text-white">
            -{Math.round((1 - product.salePrice! / product.price) * 100)}%
          </span>
        )}
        <QuickViewButton slug={product.slug} />
      </div>
      <div className="flex flex-1 flex-col pt-3">
        {product.brand && <p className="mb-1 text-xs font-semibold uppercase text-[#667085]">{product.brand.name}</p>}
        <h3 className="line-clamp-2 min-h-9 text-xs font-bold leading-[18px] text-[#1d2939] group-hover:text-[#0757c9] sm:min-h-10 sm:text-sm sm:leading-5">{product.name}</h3>
        {!compact && (
          <div className="mt-2 flex items-center gap-1 text-[#ffae00]">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} className="h-3.5 w-3.5 fill-current" />
            ))}
          </div>
        )}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-sm font-black text-[#ff1f00] sm:text-base">{hasPrice ? formatVND(price) : "Liên hệ"}</span>
          {onSale && <span className="text-xs text-[#98a2b3] line-through">{formatVND(product.price)}</span>}
        </div>
        {!compact && (
          <div className="mt-3 grid grid-cols-[1fr_38px] gap-2">
            <span className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#0757c9] px-2 text-xs font-bold text-white transition group-hover:bg-[#0048a8] sm:h-10 sm:px-3 sm:text-sm">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Thêm vào giỏ</span>
              <span className="sm:hidden">Thêm</span>
            </span>
            <span className="inline-flex h-9 items-center justify-center rounded-md border border-[#e4e9f2] text-[#667085] transition group-hover:border-[#0757c9] group-hover:text-[#0757c9] sm:h-10">
              <Heart className="h-4 w-4" />
            </span>
          </div>
        )}
        {compact && (
          <button className="mt-2 inline-flex items-center gap-1 text-left text-xs font-bold text-[#0757c9]">
            Xem chi tiết
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </Link>
  );
}
