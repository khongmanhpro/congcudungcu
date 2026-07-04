export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
};

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

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function buildStandardProductCategories(categories: CatalogCategory[] = []) {
  return STANDARD_PRODUCT_CATEGORIES.map((standard) => {
    const matched = categories.find(
      (category) => category.slug === standard.slug || normalize(category.name) === normalize(standard.name),
    );

    return matched
      ? { id: matched.id, name: standard.name, slug: matched.slug }
      : standard;
  });
}
