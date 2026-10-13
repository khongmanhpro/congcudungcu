import type { NextConfig } from "next";

// Dev: khi máy local không có public/uploads (~1.7GB), lấy ảnh từ site thật.
// Đặt UPLOADS_FALLBACK_ORIGIN=https://congcudungcu.vn trong .env để bật.
const uploadsFallbackOrigin = process.env.UPLOADS_FALLBACK_ORIGIN;

const nextConfig: NextConfig = {
  output: 'standalone',
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
