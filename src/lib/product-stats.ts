import { prisma } from "@/lib/prisma";

export type ProductStats = { sold: number; rating: number; reviewCount: number };

/** Số lượng đã bán (đơn không bị huỷ/hoàn) và điểm đánh giá trung bình cho danh sách sản phẩm. */
export async function getProductStats(productIds: string[]): Promise<Map<string, ProductStats>> {
  const stats = new Map<string, ProductStats>();
  if (productIds.length === 0) return stats;

  const [sold, ratings] = await Promise.all([
    prisma.orderItem
      .groupBy({
        by: ["productId"],
        where: { productId: { in: productIds }, order: { status: { notIn: ["CANCELLED", "REFUNDED"] } } },
        _sum: { qty: true },
      })
      .catch(() => []),
    prisma.review
      .groupBy({
        by: ["productId"],
        where: { productId: { in: productIds }, approved: true },
        _avg: { rating: true },
        _count: { _all: true },
      })
      .catch(() => []),
  ]);

  for (const id of productIds) stats.set(id, { sold: 0, rating: 0, reviewCount: 0 });
  for (const row of sold) if (row.productId) stats.get(row.productId)!.sold = row._sum.qty ?? 0;
  for (const row of ratings) {
    const entry = stats.get(row.productId)!;
    entry.rating = Math.round((row._avg.rating ?? 0) * 10) / 10;
    entry.reviewCount = row._count._all;
  }
  return stats;
}
