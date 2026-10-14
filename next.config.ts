import type { NextConfig } from "next";

// Dev: khi máy local không có public/uploads (~1.7GB), lấy ảnh từ site thật.
// Đặt UPLOADS_FALLBACK_ORIGIN=https://congcudungcu.vn trong .env để bật.
const uploadsFallbackOrigin = process.env.UPLOADS_FALLBACK_ORIGIN;

// Next.js App Router inject script inline cho RSC payload (self.__next_f.push) nên script-src
// cần 'unsafe-inline' (không dùng nonce ở đây). frame-src chỉ mở cho Google Maps embed
// (/cua-hang, /lien-he) và YouTube nocookie embed (video-showcase.tsx).
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "frame-src https://www.google.com https://maps.google.com https://www.youtube-nocookie.com",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
].join("; ");

const nextConfig: NextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  async redirects() {
    // Đổi /tin-tuc → /kien-thuc (301 để chuyển toàn bộ giá trị SEO)
    return [
      { source: "/tin-tuc", destination: "/kien-thuc", statusCode: 301 },
      { source: "/tin-tuc/:slug*", destination: "/kien-thuc/:slug*", statusCode: 301 },
    ];
  },
  async rewrites() {
    if (!uploadsFallbackOrigin) return [];
    return {
      beforeFiles: [],
      // afterFiles: chạy SAU khi tìm file tĩnh trong public/ (ảnh có sẵn thì dùng ảnh local)
      // nhưng TRƯỚC route động — route bắt-tất-cả [...path] của danh mục sẽ chặn mất nếu dùng "fallback"
      afterFiles: [{ source: "/uploads/:path*", destination: `${uploadsFallbackOrigin}/uploads/:path*` }],
      fallback: [],
    };
  },
};

export default nextConfig;
