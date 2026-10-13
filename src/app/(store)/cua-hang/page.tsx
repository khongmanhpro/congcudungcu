import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { getSettings } from "@/components/store/layout";
import { JsonLd, SITE_NAME, absoluteUrl, breadcrumbJsonLd, getSiteUrl } from "@/lib/seo";

// Render khi có request: cần DB (Docker build không có DB để render sẵn)
export const dynamic = "force-dynamic";

const DEFAULT_ADDRESS = "T2/D3B/31, Đường Bình Chuẩn 62, Khu phố Bình Thuận 2, Phường Thuận Giao, Thành phố Hồ Chí Minh";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const area = s.store_area || "TP.HCM, Bình Dương";
  const title = `Cửa hàng dụng cụ cơ khí tại ${area}`;
  const description = `Địa chỉ cửa hàng ${s.company_name || SITE_NAME}: ${s.contact_address || DEFAULT_ADDRESS}. Hotline ${s.contact_hotline || "0978.39.03.39"}. Xem hàng trực tiếp, giao nhanh khu vực ${area} và toàn quốc.`;
  return { title, description: description.slice(0, 160), alternates: { canonical: "/cua-hang" } };
}

export default async function StorePage() {
  const s = await getSettings();
  const name = s.company_name || SITE_NAME;
  const address = s.contact_address || DEFAULT_ADDRESS;
  const hotline = s.contact_hotline || "0978.39.03.39";
  const hours = s.business_hours || "Thứ 2 – Thứ 7: 7:30 – 17:30";
  const area = s.store_area || "TP.HCM, Bình Dương";
  const lat = Number(s.store_lat);
  const lng = Number(s.store_lng);
  const mapQuery = encodeURIComponent(Number.isFinite(lat) && Number.isFinite(lng) && s.store_lat ? `${lat},${lng}` : address);

  const store = {
    "@context": "https://schema.org",
    "@type": "HardwareStore",
    "@id": `${getSiteUrl()}/cua-hang#store`,
    name,
    url: absoluteUrl("/cua-hang"),
    telephone: hotline,
    email: s.contact_email || undefined,
    image: s.store_image ? absoluteUrl(s.store_image) : undefined,
    priceRange: "₫₫",
    address: { "@type": "PostalAddress", streetAddress: address, addressCountry: "VN" },
    geo: s.store_lat && s.store_lng ? { "@type": "GeoCoordinates", latitude: lat, longitude: lng } : undefined,
    openingHours: s.store_opening_hours || undefined, // định dạng schema.org, vd "Mo-Sa 07:30-17:30"
    areaServed: [...area.split(",").map((a) => a.trim()).filter(Boolean), "Việt Nam"],
    hasMap: s.store_map_url || `https://www.google.com/maps/search/?api=1&query=${mapQuery}`,
    parentOrganization: { "@id": `${getSiteUrl()}/#organization` },
    sameAs: [s.social_facebook, s.social_youtube, s.contact_zalo, s.store_map_url].filter(Boolean),
  };

  return (
    <div className="bg-[#f5f6f8] pb-8">
      <JsonLd data={[store, breadcrumbJsonLd([{ name: "Trang chủ", path: "/" }, { name: "Cửa hàng", path: "/cua-hang" }])]} />
      <div className="mx-auto max-w-7xl space-y-4 px-3 pt-3 sm:px-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-[#475569]">
          <Link href="/" className="hover:text-brand">Trang chủ</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-bold text-[#0f172a]">Cửa hàng</span>
        </nav>
        <section className="grid gap-4 rounded-lg border border-gold bg-white p-4 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <h1 className="text-2xl font-black text-[#0f172a]">Cửa hàng {name}</h1>
            <p className="mt-2 text-sm leading-6 text-[#334155]">
              Cửa hàng dụng cụ cầm tay, máy móc và thiết bị công nghiệp chính hãng phục vụ khách hàng tại {area} và giao hàng toàn quốc.
              Quý khách có thể đến xem hàng trực tiếp hoặc gọi hotline để được tư vấn, báo giá.
            </p>
            <ul className="mt-4 space-y-3 text-[15px] text-[#0f172a]">
              <li className="flex gap-2"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" /><span><strong>Địa chỉ:</strong> {address}</span></li>
              <li className="flex gap-2"><Phone className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" /><span><strong>Hotline:</strong> <a href={`tel:${hotline.replace(/[^\d+]/g, "")}`} className="text-brand hover:underline">{hotline}</a></span></li>
              {s.contact_email && <li className="flex gap-2"><Mail className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" /><span><strong>Email:</strong> <a href={`mailto:${s.contact_email}`} className="text-brand hover:underline">{s.contact_email}</a></span></li>}
              <li className="flex gap-2"><Clock className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" /><span><strong>Giờ mở cửa:</strong> {hours}</span></li>
            </ul>
            <a href={store.hasMap} target="_blank" rel="noopener" className="mt-5 inline-flex rounded-md bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-dark">
              Chỉ đường trên Google Maps
            </a>
          </div>
          <iframe
            title={`Bản đồ ${name}`}
            src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-80 w-full rounded-md border border-[#e2e8f0] lg:h-full"
          />
        </section>
      </div>
    </div>
  );
}
