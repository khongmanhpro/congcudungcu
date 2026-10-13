import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

// Đọc SITE_URL lúc chạy, không chèn cứng lúc build
export const dynamic = "force-dynamic";

const DISALLOW = ["/admin", "/api", "/thanh-toan", "/tai-khoan", "/gio-hang", "/login"];

/**
 * Cho phép rõ ràng bot tìm kiếm + bot AI (ChatGPT, Claude, Perplexity, Gemini, Apple…)
 * để sản phẩm được trích dẫn/đề xuất trong câu trả lời AI.
 */
const AI_AND_SEARCH_BOTS = [
  "Googlebot",
  "Google-Extended",
  "Bingbot",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Applebot",
  "Applebot-Extended",
  "CCBot",
  "coccocbot-web",
];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: [
      { userAgent: AI_AND_SEARCH_BOTS, allow: "/", disallow: DISALLOW },
      { userAgent: "*", allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
