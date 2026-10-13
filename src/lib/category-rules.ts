import { prisma } from "@/lib/prisma";
import { RESERVED_ROOT_SLUGS } from "@/lib/urls";

/**
 * Kiểm tra vị trí danh mục sản phẩm theo cấu trúc URL /<cha>/<con>:
 *  - tối đa 2 cấp (cha phải là danh mục gốc; danh mục đang có con không được đưa xuống làm con)
 *  - danh mục gốc không được trùng slug với route có sẵn (/san-pham, /lien-he…)
 * Trả về thông báo lỗi (tiếng Việt) hoặc null nếu hợp lệ.
 */
export async function validateCategoryPlacement(input: {
  id?: string;
  slug: string;
  parentId: string | null;
  type: "PRODUCT" | "POST";
}): Promise<string | null> {
  if (input.type !== "PRODUCT") return null;

  if (!input.parentId) {
    return RESERVED_ROOT_SLUGS.has(input.slug) ? `Slug "${input.slug}" trùng với đường dẫn có sẵn của website, hãy chọn slug khác.` : null;
  }

  if (input.parentId === input.id) return "Danh mục không thể là cha của chính nó.";
  const parent = await prisma.category.findUnique({ where: { id: input.parentId }, select: { parentId: true, type: true } });
  if (!parent || parent.type !== "PRODUCT") return "Danh mục cha không hợp lệ.";
  if (parent.parentId) return "Chỉ hỗ trợ 2 cấp danh mục: hãy chọn danh mục cha là danh mục gốc.";

  if (input.id) {
    const childCount = await prisma.category.count({ where: { parentId: input.id } });
    if (childCount > 0) return "Danh mục này đang có danh mục con nên không thể đặt làm danh mục con (tối đa 2 cấp).";
  }
  return null;
}
