import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { prisma } from "@/lib/prisma";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_DOMAIN, SITE_NAME, getSiteUrl } from "@/lib/seo";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-roboto",
  display: "swap",
});

// Không đặt canonical ở đây: mỗi trang tự khai báo canonical của chính nó
// (canonical "/" ở layout gốc sẽ bị mọi trang kế thừa → Google coi tất cả là bản sao trang chủ).
export async function generateMetadata(): Promise<Metadata> {
  const rows = await prisma.setting
    .findMany({ where: { key: { in: ["seo_title", "seo_description"] } } })
    .catch(() => []);
  const seo = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const title = seo.seo_title || DEFAULT_TITLE;
  const description = seo.seo_description || DEFAULT_DESCRIPTION;

  return {
    title: { default: title, template: `%s | ${SITE_DOMAIN}` },
    description,
    metadataBase: new URL(getSiteUrl()),
    applicationName: SITE_NAME,
    openGraph: { type: "website", locale: "vi_VN", siteName: SITE_DOMAIN, title, description },
    twitter: { card: "summary_large_image", title, description },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
    formatDetection: { telephone: false },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`h-full antialiased ${roboto.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
