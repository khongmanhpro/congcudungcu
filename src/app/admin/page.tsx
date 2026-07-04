import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatVND, formatNumber, formatDate } from "@/lib/format";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Package,
  SearchCheck,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import { DashboardChart } from "./dashboard-chart";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    productCount,
    postCount,
    orderCount,
    customerCount,
    orders,
    lowStockProducts,
    pendingOrders,
    topProducts,
    categoryRevenue,
    draftProducts,
    draftPosts,
    productSeoIssues,
    postSeoIssues,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.post.count(),
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.findMany({ take: 6, orderBy: { createdAt: "desc" }, include: { items: true } }),
    prisma.product.findMany({ where: { stock: { lte: 5 } }, take: 5, include: { images: { take: 1 } } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    // Top 5 sản phẩm bán chạy (theo tổng qty)
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { qty: true },
      orderBy: { _sum: { qty: "desc" } },
      take: 5,
    }).then(async (rows) => {
      const ids = rows.map((r) => r.productId).filter((id): id is string => !!id);
      const products = await prisma.product.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, slug: true, images: { take: 1 } },
      });
      return rows.map((r) => ({
        ...r,
        product: products.find((p) => p.id === r.productId),
      }));
    }),
    // Doanh thu theo danh mục (tháng này)
    prisma.order.findMany({
      where: { status: { in: ["PAID", "DELIVERED"] }, paidAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
      include: { items: { include: { product: { select: { categoryId: true, category: { select: { name: true } } } } } } },
    }).then((rows) => {
      const map = new Map<string, { name: string; revenue: number; qty: number }>();
      for (const o of rows) {
        for (const item of o.items) {
          const catId = item.product?.categoryId;
          const catName = item.product?.category?.name || "Không phân loại";
          if (!catId) continue;
          const existing = map.get(catId) || { name: catName, revenue: 0, qty: 0 };
          existing.revenue += item.price * item.qty;
          existing.qty += item.qty;
          map.set(catId, existing);
        }
      }
      return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
    }),
    prisma.product.count({ where: { status: "DRAFT" } }),
    prisma.post.count({ where: { status: "DRAFT" } }),
    prisma.product.count({ where: { OR: [{ shortDesc: null }, { shortDesc: "" }, { description: "" }, { images: { none: {} } }] } }),
    prisma.post.count({ where: { OR: [{ seoTitle: null }, { seoTitle: "" }, { seoDesc: null }, { seoDesc: "" }, { coverImage: null }, { coverImage: "" }] } }),
  ]);

  // Doanh thu 7 ngày gần nhất
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  const paidOrders = await prisma.order.findMany({
    where: { status: { in: ["PAID", "DELIVERED"] }, paidAt: { gte: sevenDaysAgo } },
    select: { total: true, paidAt: true },
  });
  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    const revenue = paidOrders
      .filter((o) => o.paidAt && o.paidAt.toDateString() === d.toDateString())
      .reduce((s, o) => s + o.total, 0);
    return { label, revenue };
  });
  const weekRevenue = dailyData.reduce((s, d) => s + d.revenue, 0);

  // Doanh thu tháng hiện tại
  const monthOrders = await prisma.order.findMany({
    where: { status: { in: ["PAID", "DELIVERED"] }, paidAt: { gte: monthStart } },
    select: { total: true },
  });
  const monthRevenue = monthOrders.reduce((s, o) => s + o.total, 0);

  const stats = [
    { label: "Sản phẩm", value: formatNumber(productCount), desc: `${draftProducts} nháp`, icon: Package, href: "/admin/products" },
    { label: "Bài viết", value: formatNumber(postCount), desc: `${draftPosts} nháp`, icon: FileText, href: "/admin/posts" },
    { label: "Đơn hàng", value: formatNumber(orderCount), desc: pendingOrders > 0 ? `${pendingOrders} đơn chờ xử lý` : "Không có đơn chờ", icon: ShoppingCart, href: "/admin/orders", urgent: pendingOrders > 0 },
    { label: "Khách hàng", value: formatNumber(customerCount), desc: "Tài khoản mua hàng", icon: Users, href: "/admin/customers" },
  ];
  const seoIssues = productSeoIssues + postSeoIssues;

  const statusLabel: Record<string, string> = {
    PENDING: "Chờ xử lý",
    PAID: "Đã thanh toán",
    PROCESSING: "Đang xử lý",
    SHIPPED: "Đã giao hàng",
    DELIVERED: "Đã nhận",
    CANCELLED: "Đã hủy",
    REFUNDED: "Hoàn tiền",
  };
  const statusColor: Record<string, string> = {
    PENDING: "text-warning",
    PAID: "text-green-600",
    DELIVERED: "text-green-600",
    CANCELLED: "text-red-600",
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-md border border-[#d8e0ec] bg-white p-6">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-[#0757c9]">Control room</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#172033]">Bảng điều khiển vận hành</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085]">
            Theo dõi doanh thu, đơn hàng, tồn kho, nội dung và tín hiệu SEO của website công cụ dụng cụ.
          </p>
        </div>
        <div className="rounded-md border border-[#0757c9]/20 bg-[#071a33] p-6 text-white">
          <div className="flex items-center gap-2 text-sm font-black uppercase text-white/70">
            <SearchCheck className="h-4 w-4" />
            SEO Health
          </div>
          <div className="mt-3 text-4xl font-black">{seoIssues === 0 ? "Ổn" : formatNumber(seoIssues)}</div>
          <p className="mt-2 text-sm text-white/68">
            {seoIssues === 0 ? "Chưa phát hiện thiếu dữ liệu SEO cơ bản." : "Mục cần bổ sung mô tả, ảnh hoặc meta SEO."}
          </p>
          <Link href="/admin/settings" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#ffb06b] hover:text-white">
            Kiểm tra cấu hình SEO <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href} className="group rounded-md border border-[#d8e0ec] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#0757c9] hover:shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#667085]">{s.label}</span>
                <span className={`grid h-10 w-10 place-items-center rounded-md ${s.urgent ? "bg-[#fff1f1] text-[#ef233c]" : "bg-[#f0f6ff] text-[#0757c9]"}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-3 text-3xl font-black text-[#172033]">{s.value}</div>
              <div className={`mt-1 text-xs font-semibold ${s.urgent ? "text-[#ef233c]" : "text-[#667085]"}`}>{s.desc}</div>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-md border border-[#d8e0ec] bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-[#172033]">Doanh thu 7 ngày qua</h2>
            <div className="flex items-center gap-1 text-sm font-bold text-[#16a34a]">
              <TrendingUp className="h-4 w-4" />
              {formatVND(weekRevenue)}
            </div>
          </div>
          <DashboardChart data={dailyData} />
        </div>

        <div className="space-y-4">
          <div className="rounded-md border border-[#d8e0ec] bg-white p-5">
            <h2 className="text-sm font-bold text-[#667085]">Doanh thu tháng này</h2>
            <div className="mt-2 text-3xl font-black text-[#0757c9]">{formatVND(monthRevenue)}</div>
            <p className="mt-1 text-xs text-[#667085]">{monthOrders.length} đơn hàng đã thanh toán</p>
          </div>
          <Link href="/admin/reports/revenue" className="block rounded-md border border-[#d8e0ec] bg-white p-5 transition hover:border-[#0757c9] hover:shadow-md">
            <h2 className="text-sm font-bold text-[#667085]">Báo cáo chi tiết</h2>
            <div className="mt-2 text-sm font-black text-[#0757c9]">Xem báo cáo năm →</div>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-md border border-[#d8e0ec] bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-[#172033]">Đơn hàng gần nhất</h2>
            <Link href="/admin/orders" className="text-sm font-bold text-[#0757c9] hover:underline">Xem tất cả →</Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có đơn hàng nào.</p>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => (
                <Link key={o.id} href={`/admin/orders/${o.id}`} className="-mx-2 flex items-center justify-between rounded border-b px-2 py-2 text-sm last:border-0 hover:bg-[#f7faff]">
                  <div>
                    <div className="font-mono font-medium">{o.code}</div>
                    <div className="text-xs text-muted-foreground">{o.customerName} · {o.phone} · {formatDate(o.createdAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatVND(o.total)}</div>
                    <div className={`text-xs font-medium ${statusColor[o.status] || "text-muted-foreground"}`}>{statusLabel[o.status] || o.status}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-md border border-[#d8e0ec] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h2 className="text-lg font-black text-[#172033]">Sắp hết hàng</h2>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Không có sản phẩm nào sắp hết.</p>
          ) : (
            <div className="space-y-2">
              {lowStockProducts.map((p) => (
                <Link key={p.id} href={`/admin/products/${p.id}/edit`} className="-mx-2 flex items-center gap-2 rounded border-b px-2 py-2 text-sm last:border-0 hover:bg-[#f7faff]">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-neutral-100">
                    {p.images[0] && // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 line-clamp-1">{p.name}</div>
                  <span className={`font-bold ${p.stock === 0 ? "text-red-600" : "text-warning"}`}>{p.stock}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_360px]">
        <div className="rounded-md border border-[#d8e0ec] bg-white p-5">
          <h2 className="mb-4 text-lg font-black text-[#172033]">Top sản phẩm bán chạy</h2>
          {topProducts.length === 0 || !topProducts[0]?.product ? (
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu bán hàng.</p>
          ) : (
            <div className="space-y-2">
              {topProducts.map((tp, i) => (
                <Link
                  key={tp.productId}
                  href={`/san-pham/${tp.product?.slug || ""}`}
                  className="-mx-2 flex items-center gap-3 rounded border-b px-2 py-2 text-sm last:border-0 hover:bg-[#f7faff]"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-neutral-100">
                    {tp.product?.images?.[0] && // eslint-disable-next-line @next/next/no-img-element
                      <img src={tp.product.images[0].url} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 line-clamp-1">{tp.product?.name || "—"}</div>
                  <span className="shrink-0 font-bold text-primary">{tp._sum.qty}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-md border border-[#d8e0ec] bg-white p-5">
          <h2 className="mb-4 text-lg font-black text-[#172033]">Doanh thu theo danh mục</h2>
          {categoryRevenue.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu doanh thu tháng này.</p>
          ) : (
            <div className="space-y-3">
              {categoryRevenue.map((c) => {
                const maxRev = categoryRevenue[0].revenue || 1;
                return (
                  <div key={c.name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-muted-foreground">{formatVND(c.revenue)} · {c.qty} sp</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-[#0757c9]"
                        style={{ width: `${(c.revenue / maxRev) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-md border border-[#d8e0ec] bg-white p-5">
          <h2 className="text-lg font-black text-[#172033]">Checklist quản trị</h2>
          <div className="mt-4 space-y-3">
            {[
              { label: "Xử lý đơn chờ", value: pendingOrders, href: "/admin/orders" },
              { label: "Bổ sung SEO sản phẩm", value: productSeoIssues, href: "/admin/products" },
              { label: "Bổ sung SEO bài viết", value: postSeoIssues, href: "/admin/posts" },
              { label: "Kiểm tra tồn kho thấp", value: lowStockProducts.length, href: "/admin/products" },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="flex items-center justify-between rounded border border-[#edf1f7] px-3 py-2 text-sm hover:border-[#0757c9] hover:bg-[#f7faff]">
                <span className="flex items-center gap-2 font-bold text-[#344054]">
                  {item.value === 0 ? <CheckCircle2 className="h-4 w-4 text-[#16a34a]" /> : <AlertTriangle className="h-4 w-4 text-[#ff7417]" />}
                  {item.label}
                </span>
                <span className={`font-black ${item.value === 0 ? "text-[#16a34a]" : "text-[#ef233c]"}`}>{item.value}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
