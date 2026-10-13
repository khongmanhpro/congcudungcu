export type SpecItem = { label: string; value: string };

/**
 * Đọc thông số kỹ thuật từ cột Product.specs. Dữ liệu cũ (import WordPress) lưu dạng {items: [...]},
 * form admin lưu dạng mảng [...] — chấp nhận cả hai, bỏ dòng rỗng.
 */
export function readSpecs(value: unknown): SpecItem[] {
  const list = Array.isArray(value) ? value : (value as { items?: unknown } | null)?.items;
  if (!Array.isArray(list)) return [];
  return list.filter(
    (item): item is SpecItem =>
      !!item && typeof item === "object" && typeof item.label === "string" && typeof item.value === "string" && !!item.label.trim() && !!item.value.trim(),
  );
}
