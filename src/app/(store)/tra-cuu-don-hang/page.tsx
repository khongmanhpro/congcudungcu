import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatVND, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { TrackForm } from "./track-form";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  PROCESSING: "Đang xử lý",
  SHIPPED: "Đã giao hàng",
  DELIVERED: "Đã nhận",
  CANCELLED: "Đã hủy",
  REFUNDED: "Hoàn tiền",
};

const statusSteps = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const sp = await searchParams;
  const code = sp.code?.trim();
  let order: Awaited<ReturnType<typeof prisma.order.findFirst<{ include: { items: true; shipment: true; payment: true } }>>> = null;
  let error: string | null = null;

  if (code) {
    order = await prisma.order.findFirst({
      where: { OR: [{ code }, { phone: code }] },
      include: { items: true, shipment: true, payment: true },
    });
    if (!order) error = `Không tìm thấy đơn hàng với mã/SĐT: ${code}`;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Trang chủ</Link> / <span>Theo dõi đơn hàng</span>
      </nav>

      <h1 className="mb-6 text-2xl font-bold">Theo dõi đơn hàng</h1>

      <TrackForm initialCode={code || ""} />

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {order && (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-lg font-bold">{order.code}</div>
                <div className="text-sm text-muted-foreground">{formatDateTime(order.createdAt)}</div>
              </div>
              <Badge variant={order.status === "DELIVERED" ? "success" : order.status === "CANCELLED" ? "destructive" : "warning"}>
                {statusLabel[order.status]}
              </Badge>
            </div>

            {/* Progress */}
            {order.status !== "CANCELLED" && order.status !== "REFUNDED" && (
              <div className="mt-6">
                <div className="flex justify-between">
                  {statusSteps.map((s, i) => {
                    const currentIdx = statusSteps.indexOf(order.status);
                    const done = i <= currentIdx;
                    return (
                      <div key={s} className="flex flex-1 flex-col items-center">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-primary text-white" : "bg-neutral-200 text-neutral-500"}`}>
                          {i + 1}
                        </div>
                        <span className={`mt-1 text-center text-[10px] ${done ? "font-medium text-primary" : "text-muted-foreground"}`}>
                          {statusLabel[s]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="relative mt-2 h-1 bg-neutral-200">
                  <div
                    className="absolute left-0 top-0 h-full bg-primary transition-all"
                    style={{ width: `${(statusSteps.indexOf(order.status) / (statusSteps.length - 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="rounded-lg border bg-white p-5">
            <h2 className="mb-3 font-semibold">Sản phẩm ({order.items.length})</h2>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm border-b pb-2">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-muted-foreground">{formatVND(item.price)} × {item.qty}</div>
                  </div>
                  <div className="font-medium">{formatVND(item.price * item.qty)}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between font-bold">
              <span>Tổng</span>
              <span className="text-primary">{formatVND(order.total)}</span>
            </div>
          </div>

          {/* Shipment */}
          {order.shipment && (order.shipment.trackingCode || order.shipment.carrier) && (
            <div className="rounded-lg border bg-white p-5">
              <h2 className="mb-3 font-semibold">Vận chuyển</h2>
              <div className="space-y-1 text-sm">
                {order.shipment.carrier && <div><span className="text-muted-foreground">Đơn vị:</span> {order.shipment.carrier}</div>}
                {order.shipment.trackingCode && <div><span className="text-muted-foreground">Mã vận đơn:</span> <span className="font-mono font-medium">{order.shipment.trackingCode}</span></div>}
              </div>
            </div>
          )}

          {/* Customer info */}
          <div className="rounded-lg border bg-white p-5">
            <h2 className="mb-3 font-semibold">Thông tin giao hàng</h2>
            <div className="space-y-1 text-sm">
              <div><span className="text-muted-foreground">Người nhận:</span> {order.customerName}</div>
              <div><span className="text-muted-foreground">SĐT:</span> {order.phone}</div>
              <div><span className="text-muted-foreground">Địa chỉ:</span> {order.address}</div>
              {order.city && <div><span className="text-muted-foreground">Thành phố:</span> {order.city}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
