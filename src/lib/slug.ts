/**
 * Tạo slug tiếng Việt: bỏ dấu, thay khoảng trắng/dấu câu bằng dấu gạch.
 */
export function slugify(input: string): string {
  return (
    input
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // bỏ dấu tiếng Việt
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // bỏ ký tự đặc biệt
      .replace(/[\s_]+/g, "-") // khoảng trắng/thanh dưới -> gạch
      .replace(/-+/g, "-") // gộp gạch liên tiếp
      .replace(/^-+|-+$/g, "") // bỏ gạch đầu/cuối
  );
}

/**
 * Đảm bảo slug duy nhất trong DB bằng cách thêm hậu tố -2, -3...
 * Truyền vào hàm checkExists nhận slug và trả về true nếu đã tồn tại.
 */
export async function uniqueSlug(
  base: string,
  checkExists: (slug: string) => Promise<boolean>,
): Promise<string> {
  let slug = base;
  let i = 2;
  while (await checkExists(slug)) {
    slug = `${base}-${i}`;
    i++;
  }
  return slug;
}
