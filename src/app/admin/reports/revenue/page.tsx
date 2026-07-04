import { prisma } from "@/lib/prisma";
import { formatVND, formatNumber } from "@/lib/format";
import { RevenueChart } from "./revenue-chart";
import { BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RevenueReportPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp = await searchParams;
  const year = Number(sp.year || new Date().getFullYear());

  // Doanh thu theo tháng (PAID/DELIVERED)
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ["PAID", "DELIVERED"] },
      paidAt: {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31, 23, 59, 59),
      },
    },
    select: { total: true, paidAt: true },
  });

  const monthly = Array.from({ length: 12 }, (_, i) => ({ month: `T${i + 1}`, revenue: 0, orders: 0 }));
  for (const o of orders) {
    if (o.paidAt) {
      const m = o.paidAt.getMonth();
      monthly[m].revenue += o.total;
      monthly[m].orders += 1;
    }
  }
  const yearTotal = monthly.reduce((s, m) => s + m.revenue, 0);
  const yearOrders = monthly.reduce((s, m) => s + m.orders, 0);

  // Top sản phẩm
  const topItems = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { order: { status: { in: ["PAID", "DELIVERED"] } } },
    _sum: { qty: true },
    orderBy: { _sum: { qty: "desc" } },
    take: 10,
  });
  const topProductIds = topItems.map((t) => t.productId).filter((id): id is string => !!id);
  const topProducts = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true, price: true },
  });
  const top = topItems
    .map((t) => {
      const p = topProducts.find((p) => p.id === t.productId);
      return p ? { name: p.name, qty: t._sum.qty || 0, revenue: (t._sum.qty || 0) * p.price } : null;
    })
    .filter(Boolean) as { name: string; qty: number; revenue: number }[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Báo cáo doanh thu</h1>
          <p className="text-sm text-muted-foreground">Năm {year}</p>
        </div>
        <form className="flex gap-2" method="get">
          <select name="year" defaultValue={String(year)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button type="submit" className="rounded-md border px-4 text-sm hover:bg-neutral-50">Xem</button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-5">
          <div className="text-sm text-muted-foreground">Doanh thu năm</div>
          <div className="mt-2 text-2xl font-bold text-primary">{formatVND(yearTotal)}</div>
        </div>
        <div className="rounded-lg border bg-white p-5">
          <div className="text-sm text-muted-foreground">Đơn hàng</div>
          <div className="mt-2 text-2xl font-bold">{formatNumber(yearOrders)}</div>
        </div>
        <div className="rounded-lg border bg-white p-5">
          <div className="text-sm text-muted-foreground">Giá trị TB/đơn</div>
          <div className="mt-2 text-2xl font-bold">{formatVND(yearOrders > 0 ? Math.round(yearTotal / yearOrders) : 0)}</div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-5">
        <h2 className="mb-4 font-semibold">Doanh thu theo tháng</h2>
        <RevenueChart data={monthly} />
      </div>

      <div className="rounded-lg border bg-white p-5">
        <h2 className="mb-4 font-semibold">Top 10 sản phẩm bán chạy</h2>
        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2">#</th>
                <th className="pb-2">Tên</th>
                <th className="pb-2 text-right">Số lượng</th>
                <th className="pb-2 text-right">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {top.map((t, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2">{i + 1}</td>
                  <td className="py-2 font-medium">{t.name}</td>
                  <td className="py-2 text-right">{formatNumber(t.qty)}</td>
                  <td className="py-2 text-right font-medium">{formatVND(t.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
