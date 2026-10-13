export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  children?: CatalogCategory[];
};

/** Danh mục mặc định, chỉ dùng khi DB chưa có danh mục sản phẩm nào. */
export const STANDARD_PRODUCT_CATEGORIES: CatalogCategory[] = [
  { id: "tools", name: "Công Cụ, Dụng Cụ", slug: "cong-cu-dung-cu" },
  { id: "safety", name: "Đồ Bảo Hộ Lao Động", slug: "do-bao-ho-lao-dong" },
  { id: "electric-tools", name: "Dụng Cụ Điện", slug: "dung-cu-dien" },
  { id: "gas-tools", name: "Dụng Cụ Dùng Xăng", slug: "dung-cu-dung-xang" },
  { id: "pneumatic-tools", name: "Dụng Cụ Khí Nén", slug: "dung-cu-khi-nen" },
  { id: "welding", name: "Máy Hàn & Phụ Kiện", slug: "may-han-phu-kien" },
  { id: "drills", name: "Máy Khoan - Máy Vặn Vít", slug: "may-khoan-may-van-vit" },
  { id: "grinders", name: "Máy Mài & Máy Cắt", slug: "may-mai-may-cat" },
  { id: "machinery", name: "Máy Cơ Khí", slug: "may-co-khi" },
  { id: "parts", name: "Phụ Tùng & Linh Kiện", slug: "phu-tung-linh-kien" },
  { id: "electrical", name: "Thiết Bị Điện", slug: "thiet-bi-dien" },
  { id: "measuring", name: "Thiết Bị Đo Lường", slug: "thiet-bi-do-luong" },
];

/** Dùng danh mục thật từ DB; chỉ rơi về danh sách mặc định khi DB trống. */
export function buildStandardProductCategories(categories: CatalogCategory[] = []): CatalogCategory[] {
  return categories.length > 0 ? categories : STANDARD_PRODUCT_CATEGORIES;
}
