import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { getSettings } from "@/components/store/layout";
import { brandPath } from "@/lib/urls";
import { JsonLd, SITE_NAME, absoluteUrl, breadcrumbJsonLd, getSiteUrl } from "@/lib/seo";

const DEFAULT_ADDRESS = "T2/D3B/31, Đường Bình Chuẩn 62, Khu phố Bình Thuận 2, Phường Thuận Giao, Thành phố Hồ Chí Minh";
const DEFAULT_HOTLINE = "0978.39.03.39";
const COMPANY_LEGAL_NAME = "Công ty Cổ phần Thiết Bị Công Nghiệp Workman";
const TAX_CODE = "3702963744";
const FOUNDING_DATE_DISPLAY = "tháng 3/2022";

const DISTRIBUTED_BRANDS = [
  { name: "WOKIN", slug: "wokin", note: "Đại diện phân phối chính hãng tại Việt Nam" },
  { name: "WORKPRO", slug: "workpro" },
  { name: "MATADOR", slug: "matador" },
  { name: "KONSUN", slug: "konsun" },
  { name: "KNIPEX", slug: "knipex" },
  { name: "TOPTUL", slug: "toptul" },
  { name: "MITOOLS", slug: "mitools" },
  { name: "BOSCH", slug: "bosch" },
  { name: "CSPS", slug: "csps" },
  { name: "YUMITA", slug: "yumita" },
];

const CORE_VALUES = [
  "Phục vụ khách hàng bằng sản phẩm và dịch vụ chất lượng tốt nhất.",
  "Chủ động, trung thực, tận tâm — đặt chữ \"Tín\" lên hàng đầu.",
  "Làm việc với tâm huyết, đam mê, trách nhiệm và không ngừng sáng tạo.",
  "Đoàn kết, coi trọng lợi ích của khách hàng và đối tác.",
];

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const name = s.company_name || SITE_NAME;
  const title = `Giới thiệu ${name} — Workman JSC`;
  const description = `congcudungcu.vn là kênh bán lẻ trực tuyến của ${COMPANY_LEGAL_NAME} (Workman JSC), thành lập ${FOUNDING_DATE_DISPLAY}, đại diện phân phối chính hãng WOKIN tại Việt Nam.`;
  return { title, description: description.slice(0, 160), alternates: { canonical: "/gioi-thieu" } };
}

export default async function AboutPage() {
  const s = await getSettings();
  const name = s.company_name || SITE_NAME;
  const address = s.contact_address || DEFAULT_ADDRESS;
  const hotline = s.contact_hotline || DEFAULT_HOTLINE;
  const siteUrl = getSiteUrl();

  const aboutPage = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${siteUrl}/gioi-thieu#aboutpage`,
    url: absoluteUrl("/gioi-thieu"),
    name: `Giới thiệu ${name}`,
    mainEntity: { "@id": `${siteUrl}/#organization` },
  };

  return (
    <div className="bg-[#f5f6f8] pb-8">
      <JsonLd data={[aboutPage, breadcrumbJsonLd([{ name: "Trang chủ", path: "/" }, { name: "Giới thiệu", path: "/gioi-thieu" }])]} />
      <div className="mx-auto max-w-5xl space-y-4 px-3 pt-3 sm:px-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-[#475569]">
          <Link href="/" className="hover:text-brand">Trang chủ</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-bold text-[#0f172a]">Giới thiệu</span>
        </nav>

        <section className="rounded-lg border border-gold bg-white p-5 sm:p-6">
          <h1 className="text-2xl font-black text-[#0f172a]">Giới thiệu về {name}</h1>
          <p className="mt-3 text-sm leading-6 text-[#334155]">
            congcudungcu.vn là kênh bán lẻ trực tuyến của{" "}
            <strong>{COMPANY_LEGAL_NAME}</strong> (Workman JSC, mã số thuế {TAX_CODE}),
            thành lập từ {FOUNDING_DATE_DISPLAY}, chuyên nhập khẩu và phân phối dụng cụ cầm tay, dụng cụ điện,
            dụng cụ gia công, thiết bị đo lường, thiết bị garage và thiết bị công nghiệp chính hãng
            tại Việt Nam.
          </p>
          <ul className="mt-4 space-y-2 text-[15px] text-[#0f172a]">
            <li className="flex gap-2"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" /><span>{address}</span></li>
            <li className="flex gap-2"><Phone className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" /><a href={`tel:${hotline.replace(/[^\d+]/g, "")}`} className="text-brand hover:underline">{hotline}</a></li>
            {s.contact_email && <li className="flex gap-2"><Mail className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" /><a href={`mailto:${s.contact_email}`} className="text-brand hover:underline">{s.contact_email}</a></li>}
          </ul>
        </section>

        <section className="rounded-lg border border-gold bg-white p-5 sm:p-6">
          <h2 className="text-lg font-black text-[#0f172a]">Thương hiệu phân phối</h2>
          <p className="mt-2 text-sm leading-6 text-[#334155]">
            Workman JSC là đơn vị đại diện phân phối chính hãng <strong>WOKIN</strong> tại Việt Nam,
            đồng thời phân phối các thương hiệu dụng cụ công nghiệp uy tín khác:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DISTRIBUTED_BRANDS.map((b) => (
              <Link
                key={b.slug}
                href={brandPath(b.slug)}
                title={b.note}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 text-sm font-bold text-[#0f172a] hover:border-gold hover:bg-gold/10"
              >
                {b.note && <ShieldCheck className="h-3.5 w-3.5 text-gold-dark" />}
                {b.name}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-gold bg-white p-5 sm:p-6">
          <h2 className="text-lg font-black text-[#0f172a]">Sứ mệnh &amp; giá trị cốt lõi</h2>
          <p className="mt-2 text-sm leading-6 text-[#334155]">
            &ldquo;Không ngừng phấn đấu, phát triển để cung cấp cho khách hàng những sản phẩm và dịch vụ tốt nhất.&rdquo;
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-[#334155]">
            {CORE_VALUES.map((v) => <li key={v}>{v}</li>)}
          </ul>
        </section>

        <section className="rounded-lg border border-gold bg-white p-5 sm:p-6">
          <h2 className="text-lg font-black text-[#0f172a]">Kênh liên quan</h2>
          <p className="mt-2 text-sm leading-6 text-[#334155]">
            Xem thêm thông tin công ty tại{" "}
            <a href="https://workmanjsc.vn" target="_blank" rel="noopener" className="font-bold text-brand hover:underline">workmanjsc.vn</a>
            {" "}hoặc thương hiệu{" "}
            <a href="https://wokin.vn" target="_blank" rel="noopener" className="font-bold text-brand hover:underline">wokin.vn</a>.
            Để được tư vấn chọn dụng cụ và nhận báo giá, vui lòng{" "}
            <Link href="/lien-he" className="font-bold text-brand hover:underline">liên hệ</Link>
            {" "}hoặc ghé{" "}
            <Link href="/cua-hang" className="font-bold text-brand hover:underline">cửa hàng</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
