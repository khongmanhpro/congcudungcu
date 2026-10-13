import { prisma } from "@/lib/prisma";

/** ID của danh mục và toàn bộ danh mục con cháu (duyệt theo từng tầng). */
export async function getCategorySubtreeIds(rootId: string): Promise<string[]> {
  const ids = [rootId];
  let frontier = [rootId];
  // giới hạn độ sâu để tránh vòng lặp nếu dữ liệu cha-con bị lỗi
  for (let depth = 0; depth < 6 && frontier.length > 0; depth++) {
    const children = await prisma.category.findMany({
      where: { parentId: { in: frontier } },
      select: { id: true },
    });
    frontier = children.map((child) => child.id).filter((id) => !ids.includes(id));
    ids.push(...frontier);
  }
  return ids;
}
