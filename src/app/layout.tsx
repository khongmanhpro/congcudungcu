import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "congcudungcu.vn — Dụng cụ công nghiệp chính hãng",
    template: "%s | congcudungcu.vn",
  },
  description:
    "congcudungcu.vn — nhà phân phối dụng cụ cầm tay, máy gia công và thiết bị công nghiệp chính hãng.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "congcudungcu.vn",
    title: "congcudungcu.vn — Dụng cụ công nghiệp chính hãng",
    description: "Dụng cụ cầm tay, máy gia công và thiết bị công nghiệp chính hãng.",
  },
  twitter: {
    card: "summary_large_image",
    title: "congcudungcu.vn",
    description: "Dụng cụ công nghiệp chính hãng.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
