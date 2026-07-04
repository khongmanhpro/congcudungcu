import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatVND, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart } from "lucide-react";

export const dynamic = "force-dynamic";

const statusVariant: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  PENDING: "warning",
  PAID: "success",
  PROCESSING: "default",
  SHIPPED: "default",
  DELIVERED: "success",
  CANCELLED: "destructive",
  REFUNDED: "secondary",
};

const statusLabel: Record<string, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  PROCESSING: "Đang xử lý",
  SHIPPED: "Đã giao hàng",
  DELIVERED: "Đã nhận",
  CANCELLED: "Đã hủy",
  REFUNDED: "Hoàn tiền",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page || "1");
  const pageSize = 20;
  const status = sp.status;
  const search = sp.search;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true, payment: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Đơn hàng</h1>
        <p className="text-sm text-muted-foreground">{total} đơn</p>
      </div>

      <form className="flex gap-2" method="get">
        <input
          name="search"
          defaultValue={search}
          placeholder="Mã đơn / tên / SĐT..."
          className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
        />
        <select name="status" defaultValue={status || ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">Tất cả</option>
          {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button type="submit" className="rounded-md border px-4 text-sm hover:bg-neutral-50">Lọc</button>
      </form>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã đơn</TableHead>
              <TableHead>Khách</TableHead>
              <TableHead>Tổng</TableHead>
              <TableHead>Thanh toán</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Xem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  <ShoppingCart className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  Chưa có đơn hàng nào.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.code}</TableCell>
                  <TableCell>
                    <div>{o.customerName}</div>
                    <div className="text-xs text-muted-foreground">{o.phone}</div>
                  </TableCell>
                  <TableCell className="font-medium">{formatVND(o.total)}</TableCell>
                  <TableCell>
                    {o.payment ? (
                      <Badge variant={o.payment.status === "SUCCESS" ? "success" : o.payment.status === "PENDING" ? "warning" : "secondary"}>
                        {o.payment.provider} · {o.payment.status}
                      </Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell><Badge variant={statusVariant[o.status]}>{statusLabel[o.status]}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDateTime(o.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/orders/${o.id}`} className="text-sm text-primary hover:underline">Chi tiết</Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/orders?page=${p}${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}
              className={`rounded-md px-3 py-1 text-sm ${p === page ? "bg-primary text-white" : "border hover:bg-neutral-50"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
