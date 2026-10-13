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
      afterFiles: [],
      // fallback chỉ chạy khi không tìm thấy file tĩnh trong public/
      fallback: [{ source: "/uploads/:path*", destination: `${uploadsFallbackOrigin}/uploads/:path*` }],
    };
  },
};

export default nextConfig;
