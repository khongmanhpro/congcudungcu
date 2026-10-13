import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

// Đọc SITE_URL lúc chạy, không chèn cứng lúc build
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/thanh-toan", "/tai-khoan", "/gio-hang", "/login"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
