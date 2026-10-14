/**
 * Tiện ích SEO dùng chung.
 *
 * SITE_URL đọc lúc chạy (runtime). KHÔNG dùng NEXT_PUBLIC_SITE_URL cho canonical/sitemap:
 * biến NEXT_PUBLIC_* bị Next.js chèn cứng lúc build Docker (khi đó chưa có env) nên ra localhost.
 */
const DEFAULT_SITE_URL = "https://congcudungcu.vn";

export const SITE_NAME = "Công Cụ Dụng Cụ";
export const SITE_DOMAIN = "congcudungcu.vn";
export const DEFAULT_TITLE = "Công Cụ Dụng Cụ — Dụng cụ & thiết bị công nghiệp chính hãng";
export const DEFAULT_DESCRIPTION =
  "congcudungcu.vn phân phối dụng cụ cầm tay, dụng cụ điện, khí nén, thiết bị đo lường, thiết bị garage chính hãng. Giá tốt, có hóa đơn VAT, giao hàng toàn quốc.";

export function getSiteUrl(): string {
  const value = process.env["SITE_URL"] || DEFAULT_SITE_URL;
  return value.replace(/\/+$/, "");
}

/** Đường dẫn tương đối → URL tuyệt đối (giữ nguyên nếu đã là http/https). */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${getSiteUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Bỏ thẻ HTML, gộp khoảng trắng, cắt ở ranh giới từ cho meta description (~155 ký tự). */
export function toMetaDescription(input: string | null | undefined, max = 155): string | undefined {
  if (!input) return undefined;
  const text = input
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return undefined;
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).replace(/[\s,.;:–-]+$/, "")}…`;
}

/** Canonical cho trang có phân trang: trang 1 không kèm ?page. */
export function pagedPath(path: string, page: number): string {
  return page > 1 ? `${path}?page=${page}` : path;
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/**
 * Organization + WebSite — khai báo MỘT LẦN cho toàn site (gắn ở layout, không phải riêng từng
 * trang) để công cụ phân tích SEO không báo thiếu "Organization/WebSite" ở trang danh mục,
 * thương hiệu, bài viết… (trước đây chỉ có ở trang chủ nên các trang khác bị trừ điểm Schema).
 */
export function siteJsonLd(settings: Record<string, string>) {
  const siteUrl = getSiteUrl();
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: settings.company_name || SITE_NAME,
      url: siteUrl,
      logo: absoluteUrl("/brand/icon.png"),
      foundingDate: "2022-03",
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
  ];
}

/** Thẻ <script type="application/ld+json"> an toàn (chặn "</script>" trong dữ liệu). */
export function JsonLd({ data }: { data: object | object[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
