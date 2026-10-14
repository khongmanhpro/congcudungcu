import Link from "next/link";
import { BannerSlider, type BannerSlide } from "@/components/store/banner-slider";
import { getCategoryTree, getSettings, parsePipeLines } from "@/components/store/layout";
import { PagedGrid } from "@/components/store/paged-grid";
import { ProductCard, type ProductCardData } from "@/components/store/product-card";
import { VideoShowcase, type ShowcaseVideo } from "@/components/store/video-showcase";
import { getProductStats, type ProductStats } from "@/lib/product-stats";
import { prisma } from "@/lib/prisma";
import { categoryPath } from "@/lib/urls";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, JsonLd, SITE_NAME, absoluteUrl, getSiteUrl } from "@/lib/seo";
import { FaqSection, faqJsonLd, type FaqItem } from "@/components/store/faq-section";
import type { Metadata } from "next";

export const revalidate = 60;

const PAGE_SIZE = 12; // 2 hàng × 6 sản phẩm

// Câu hỏi chung của khách khi vào trang chủ — dùng đúng số liệu đã công bố ở các trang chính sách
// (/van-chuyen, /chinh-sach-doi-tra, /phuong-thuc-thanh-toan) để không mâu thuẫn thông tin giữa các trang.
const HOME_FAQ: FaqItem[] = [
  { question: "congcudungcu.vn có hóa đơn VAT và CO/CQ không?", answer: "Có. Sản phẩm chính hãng, đầy đủ CO/CQ và xuất hóa đơn VAT theo yêu cầu." },
  { question: "Giao hàng mất bao lâu, phí ship bao nhiêu?", answer: "Giao hàng toàn quốc trong 2–5 ngày làm việc. Miễn phí giao hàng cho đơn từ 500.000đ; hỗ trợ giao hỏa tốc nội thành trong 2–4 giờ." },
  { question: "Đổi trả hàng như thế nào?", answer: "Đổi trả trong vòng 7 ngày kể từ ngày nhận hàng nếu còn nguyên tem, hộp, phụ kiện. Hoàn tiền 100% nếu sản phẩm lỗi do nhà sản xuất." },
  { question: "Thanh toán bằng cách nào?", answer: "Thanh toán khi nhận hàng (COD), qua VNPay hoặc chuyển khoản ngân hàng. Khách hàng doanh nghiệp có thể thanh toán theo hợp đồng." },
  { question: "Có báo giá riêng cho doanh nghiệp, đại lý không?", answer: "Có. Vui lòng gửi yêu cầu qua trang Liên hệ hoặc gọi hotline để nhận báo giá theo số lượng." },
];

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const title = settings.seo_title || DEFAULT_TITLE;
  const description = settings.seo_description || DEFAULT_DESCRIPTION;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "/" },
    openGraph: { type: "website", url: "/", title, description, siteName: SITE_NAME, locale: "vi_VN" },
  };
}

const productInclude = {
  images: { take: 1, orderBy: { position: "asc" as const } },
  brand: { select: { name: true } },
};

/** Nhận ID hoặc link YouTube (watch?v=, youtu.be/, shorts/, embed/) → ID video. */
function youtubeId(value: string) {
  const v = value.trim();
  const match = v.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/);
  if (match) return match[1];
  return /^[\w-]{11}$/.test(v) ? v : null;
}

function chunk<T>(items: T[], size: number) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size));
}

export default async function HomePage() {
  const [categoryTree, settings, featured, onSale, newest, brands] = await Promise.all([
    getCategoryTree(),
    getSettings(),
    prisma.product.findMany({
      where: { status: "PUBLISHED", featured: true },
      take: 36,
      include: productInclude,
      orderBy: { updatedAt: "desc" },
    }).catch(() => []),
    prisma.product.findMany({
      where: { status: "PUBLISHED", salePrice: { gt: 0 } },
      take: 24,
      include: productInclude,
      orderBy: { updatedAt: "desc" },
    }).catch(() => []),
    prisma.product.findMany({
      where: { status: "PUBLISHED" },
      take: 24,
      include: productInclude,
      orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    }).catch(() => []),
    prisma.brand.findMany({ orderBy: { name: "asc" }, take: 24 }).catch(() => []),
  ]);

  const siteUrl = getSiteUrl();
  const highlight = featured.length > 0 ? featured : newest;
  const sale = onSale.filter((p) => p.salePrice! < p.price);
  const stats = await getProductStats([...new Set([...highlight, ...sale, ...newest].map((p) => p.id))]);

  // Danh mục nổi bật: ưu tiên danh mục cấp 2 (cụ thể hơn), dạng nút viên thuốc
  const subCategories = categoryTree.flatMap((c) => (c.children ?? []).map((child) => ({ ...child, parent: { slug: c.slug } })));
  const chips = (subCategories.length >= 6 ? subCategories : categoryTree).slice(0, 14);

  const configuredBanners = parsePipeLines(settings.home_banners).map(([image, title, subtitle, href]) => ({
    image: image.startsWith("http") || image.startsWith("/") ? image : undefined,
    title: title || "Công Cụ Dụng Cụ",
    subtitle,
    href: href || "/san-pham",
  }));
  const productImages = highlight.flatMap((p) => (p.images[0] ? [p.images[0].url] : []));
  const banners: BannerSlide[] = configuredBanners.length > 0 ? configuredBanners : [
    { title: "Công Cụ Dụng Cụ", subtitle: settings.site_tagline || "Thiết bị công nghiệp chính hãng", href: "/san-pham", productImages: productImages.slice(0, 3) },
    { title: "Dụng cụ chính hãng", subtitle: "Đầy đủ CO/CQ, hóa đơn VAT — giao hàng toàn quốc", href: "/san-pham", productImages: productImages.slice(3, 6) },
    { title: "Báo giá nhanh trong ngày", subtitle: `Hotline ${settings.contact_hotline || "0978.39.03.39"}`, href: "/lien-he", productImages: productImages.slice(6, 9) },
  ];

  const videos: ShowcaseVideo[] = parsePipeLines(settings.home_youtube_videos)
    .flatMap(([url, title]) => {
      // hỗ trợ cả định dạng cũ: nhiều link cách nhau dấu phẩy trên một dòng
      const ids = url.split(",").map(youtubeId).filter((id): id is string => !!id);
      return ids.map((id, i) => ({ id, title: title && i === 0 ? title : "Video hướng dẫn" }));
    })
    .slice(0, 6);

  return (
    <div className="bg-[#f5f6f8] pb-6 text-[#0f172a]">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": `${siteUrl}/#organization`,
            name: settings.company_name || SITE_NAME,
            url: siteUrl,
            email: settings.contact_email || undefined,
            telephone: settings.contact_hotline || undefined,
            address: settings.contact_address ? { "@type": "PostalAddress", streetAddress: settings.contact_address, addressCountry: "VN" } : undefined,
            sameAs: [settings.social_facebook, settings.social_youtube].filter(Boolean),
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${siteUrl}/#website`,
            name: SITE_NAME,
            url: siteUrl,
            inLanguage: "vi-VN",
            publisher: { "@id": `${siteUrl}/#organization` },
            potentialAction: {
              "@type": "SearchAction",
              target: { "@type": "EntryPoint", urlTemplate: absoluteUrl("/tim-kiem?q={search_term_string}") },
              "query-input": "required name=search_term_string",
            },
          },
          faqJsonLd(HOME_FAQ),
        ]}
      />
      <div className="mx-auto max-w-7xl space-y-4 px-3 pt-3 sm:px-4">
        <h1 className="sr-only">{settings.seo_title || DEFAULT_TITLE}</h1>
        <p className="text-sm leading-6 text-[#475569] sm:text-[15px]">
          congcudungcu.vn là nhà phân phối dụng cụ cầm tay, dụng cụ điện, khí nén, máy hàn và thiết bị đo lường công nghiệp chính hãng
          tại Việt Nam, gồm các thương hiệu KNIPEX, BOSCH, TOPTUL, WOKIN, MATADOR và nhiều hãng khác — có hóa đơn VAT, CO/CQ đầy đủ.
          Giao hàng toàn quốc trong 2–5 ngày, báo giá nhanh cho doanh nghiệp, đại lý và nhà thầu.
        </p>
        <BannerSlider slides={banners} />

        {chips.length > 0 && (
          <Card title="Danh mục nổi bật" meta={`${chips.length} danh mục`}>
            <div className="flex flex-wrap gap-2">
              {chips.map((category) => (
                <Link
                  key={category.id}
                  href={categoryPath(category)}
                  className="rounded-full border border-gold px-3 py-1.5 text-[13px] font-bold text-[#0f172a] transition hover:bg-gold hover:text-brand-dark"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </Card>
        )}

        {highlight.length > 0 && (
          <Card title="Sản phẩm nổi bật" meta={`${highlight.length} sản phẩm`}>
            <ProductPages products={highlight} stats={stats} />
          </Card>
        )}

        <Card
          title="Khuyến mãi tự động"
          action={
            <Link href="/lien-he" className="rounded-full bg-gradient-to-r from-gold to-[#d97706] px-4 py-2 text-xs font-bold text-white shadow hover:brightness-105 sm:text-sm">
              + Yêu cầu giá khuyến mãi
            </Link>
          }
        >
          {sale.length > 0 ? (
            <ProductPages products={sale} stats={stats} />
          ) : (
            <p className="text-sm text-[#475569]">Chưa có sản phẩm đủ điều kiện khuyến mãi.</p>
          )}
        </Card>

        {newest.length > 0 && (
          <Card title="Dòng sản phẩm mới" meta={`Luôn lấy ${newest.length} sản phẩm mới nhất`}>
            <ProductPages products={newest} stats={stats} />
          </Card>
        )}

        {videos.length > 0 && (
          <Card
            title="Video / Hướng dẫn"
            action={settings.social_youtube ? <a href={settings.social_youtube} target="_blank" rel="noopener" className="text-xs text-[#475569] hover:text-brand">Kênh YouTube</a> : undefined}
          >
            <VideoShowcase videos={videos} channelUrl={settings.social_youtube} channelName={settings.site_name || "Công Cụ Dụng Cụ"} />
          </Card>
        )}

        {brands.length > 0 && (
          <div className="grid grid-cols-3 gap-2 border-y border-[#e2e8f0] py-3 sm:grid-cols-6 lg:grid-cols-12">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/san-pham?brand=${brand.id}`}
                title={brand.name}
                className="grid h-[54px] place-items-center rounded-md border border-[#fecaca] bg-white px-2 text-center transition hover:border-gold"
              >
                {brand.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={brand.logoUrl} alt={brand.name} loading="lazy" width={120} height={36} className="max-h-9 max-w-full object-contain" />
                ) : (
                  <span className="line-clamp-2 text-xs font-bold uppercase text-[#334155]">{brand.name}</span>
                )}
              </Link>
            ))}
          </div>
        )}

        <FaqSection items={HOME_FAQ} />
      </div>
    </div>
  );
}

/** Khối trắng viền vàng: tiêu đề trái, thông tin phụ / nút bên phải. */
function Card({ title, meta, action, children }: { title: string; meta?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-gold bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xl font-black text-[#0f172a]">{title}</h2>
        {action ?? (meta && <span className="text-right text-xs text-[#475569]">{meta}</span>)}
      </div>
      {children}
    </section>
  );
}

function ProductPages({ products, stats }: { products: ProductCardData[]; stats: Map<string, ProductStats> }) {
  return (
    <PagedGrid
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      pages={chunk(products, PAGE_SIZE).map((page) =>
        page.map((product) => <ProductCard key={product.id} product={product} stats={stats.get(product.id)} />),
      )}
    />
  );
}
