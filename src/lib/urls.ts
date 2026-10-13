/**
 * Nguồn DUY NHẤT để tạo đường dẫn công khai (đừng viết tay "/danh-muc/..." ở chỗ khác).
 *
 * Cấu trúc URL:
 *   /<danh-muc-cha>                  danh mục cấp 1
 *   /<danh-muc-cha>/<danh-muc-con>   danh mục cấp 2
 *   /san-pham/<slug>                 sản phẩm (phẳng — đổi danh mục không đổi URL)
 *   /thuong-hieu/<slug>[/<danh-muc>] thương hiệu, thương hiệu × danh mục
 *   /kien-thuc/<slug>                bài viết
 */

type CategoryRef = { slug: string; parent?: { slug: string } | null };

export function categoryPath(category: CategoryRef): string {
  return category.parent ? `/${category.parent.slug}/${category.slug}` : `/${category.slug}`;
}

export const productPath = (slug: string) => `/san-pham/${slug}`;
export const brandPath = (slug: string, categorySlug?: string) => (categorySlug ? `/thuong-hieu/${slug}/${categorySlug}` : `/thuong-hieu/${slug}`);
export const postPath = (slug: string) => `/kien-thuc/${slug}`;

/**
 * Đoạn đầu URL đã có route riêng → không được dùng làm slug danh mục cấp 1
 * (nếu trùng, route tĩnh sẽ "che" danh mục).
 */
export const RESERVED_ROOT_SLUGS = new Set([
  "san-pham", "thuong-hieu", "kien-thuc", "tin-tuc", "danh-muc", "cua-hang", "lien-he", "gio-hang", "thanh-toan",
  "tai-khoan", "tim-kiem", "yeu-thich", "so-sanh", "dang-nhap", "dang-ky", "tra-cuu-don-hang", "khuyen-mai",
  "gioi-thieu", "admin", "api", "login", "feeds", "llms.txt", "llms-full.txt", "sitemap.xml", "robots.txt",
  "chinh-sach-bao-hanh", "chinh-sach-doi-tra", "van-chuyen", "chinh-sach-bao-mat", "chinh-sach-ban-hang",
  "phuong-thuc-thanh-toan", "tro-thanh-dai-ly", "uploads",
]);
