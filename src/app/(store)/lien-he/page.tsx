import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Clock, Headphones, Phone, Mail, MapPin } from "lucide-react";
import { ContactForm } from "./contact-form";

export const revalidate = 3600;

const DEFAULT_ADDRESS = "T2/D3B/31, Đường Bình Chuẩn 62, Khu phố Bình Thuận 2, Phường Thuận Giao, Thành phố Hồ Chí Minh";
const DEFAULT_PHONE = "0978.39.03.39";
const DEFAULT_HOTLINE = "+84 978.39.03.39";
const DEFAULT_BUSINESS_HOURS = "24/7";

export default async function ContactPage() {
  const settings = await prisma.setting.findMany().catch(() => [
    { key: "contact_address", value: DEFAULT_ADDRESS },
    { key: "contact_phone", value: DEFAULT_PHONE },
    { key: "contact_hotline", value: DEFAULT_HOTLINE },
    { key: "business_hours", value: DEFAULT_BUSINESS_HOURS },
    { key: "contact_email", value: "kinhdoanh@congcudungcu.vn" },
  ]);
  const s = Object.fromEntries(settings.map((x) => [x.key, x.value]));
  const contactAddress = s.contact_address || DEFAULT_ADDRESS;
  const contactPhone = s.contact_phone || DEFAULT_PHONE;
  const contactHotline = s.contact_hotline || DEFAULT_HOTLINE;
  const businessHours = s.business_hours || DEFAULT_BUSINESS_HOURS;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Trang chủ</Link> / <span>Liên hệ</span>
      </nav>

      <h1 className="mb-6 text-2xl font-bold">Liên hệ</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Thông tin liên hệ</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 text-primary" /><span>{contactAddress}</span></li>
            <li className="flex items-center gap-3"><Phone className="h-5 w-5 text-primary" /><a href="tel:+84978390339" className="hover:text-primary">{contactPhone}</a></li>
            <li className="flex items-center gap-3"><Headphones className="h-5 w-5 text-primary" /><a href="tel:+84978390339" className="hover:text-primary">Hotline: {contactHotline}</a></li>
            <li className="flex items-center gap-3"><Clock className="h-5 w-5 text-primary" /><span>Giờ làm việc: {businessHours}</span></li>
            {s.contact_email && (
              <li className="flex items-center gap-3"><Mail className="h-5 w-5 text-primary" /><a href={`mailto:${s.contact_email}`} className="hover:text-primary">{s.contact_email}</a></li>
            )}
          </ul>
          <div className="overflow-hidden rounded-lg border">
            <iframe
              src={`https://maps.google.com/maps?q=${encodeURIComponent(contactAddress)}&output=embed`}
              width="100%"
              height="300"
              loading="lazy"
              title="Bản đồ"
            />
          </div>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
