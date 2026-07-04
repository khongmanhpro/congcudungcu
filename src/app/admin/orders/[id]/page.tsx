import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatVND, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { OrderStatusUpdater } from "../order-status-updater";

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

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, payment: true, shipment: true, coupon: true, customer: true },
  });

  if (!order) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/orders" className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ChevronLeft className="h-4 w-4" /> Quay lại
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Đơn hàng {order.code}</h1>
            <p className="text-sm text-muted-foreground">{formatDateTime(order.createdAt)}</p>
          </div>
          <Badge variant={order.status === "PAID" || order.status === "DELIVERED" ? "success" : "warning"}>
            {statusLabel[order.status]}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border bg-white p-5">
            <h2 className="mb-4 font-semibold">Sản phẩm ({order.items.length})</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    {item.sku && <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>}
                    <div className="text-sm text-muted-foreground">
                      {formatVND(item.price)} × {item.qty}
                    </div>
                  </div>
                  <div className="font-medium">{formatVND(item.price * item.qty)}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between"><span>Tạm tính</span><span>{formatVND(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Giảm giá{order.coupon ? ` (${order.coupon.code})` : ""}</span><span>-{formatVND(order.discount)}</span></div>}
              <div className="flex justify-between"><span>Phí ship</span><span>{formatVND(order.shippingFee)}</span></div>
              <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Tổng</span><span className="text-primary">{formatVND(order.total)}</span></div>
            </div>
          </div>

          {order.payment && (
            <div className="rounded-lg border bg-white p-5">
              <h2 className="mb-4 font-semibold">Thanh toán</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Phương thức:</span> {order.payment.provider}</div>
                <div><span className="text-muted-foreground">Trạng thái:</span> <Badge variant={order.payment.status === "SUCCESS" ? "success" : "warning"}>{order.payment.status}</Badge></div>
                <div><span className="text-muted-foreground">Số tiền:</span> {formatVND(order.payment.amount)}</div>
                {order.payment.vnpTxnNo && <div><span className="text-muted-foreground">VNPay txn:</span> {order.payment.vnpTxnNo}</div>}
                {order.payment.paidAt && <div><span className="text-muted-foreground">Ngày trả:</span> {formatDateTime(order.payment.paidAt)}</div>}
              </div>
            </div>
          )}

          {order.shipment && (
            <div className="rounded-lg border bg-white p-5">
              <h2 className="mb-4 font-semibold">Vận chuyển</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Đơn vị:</span> {order.shipment.carrier || "—"}</div>
                <div><span className="text-muted-foreground">Mã vận đơn:</span> {order.shipment.trackingCode || "—"}</div>
                <div><span className="text-muted-foreground">Phí:</span> {formatVND(order.shipment.fee)}</div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border bg-white p-5">
            <h2 className="mb-4 font-semibold">Khách hàng</h2>
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Họ tên:</span> {order.customerName}</div>
              <div><span className="text-muted-foreground">SĐT:</span> {order.phone}</div>
              {order.email && <div><span className="text-muted-foreground">Email:</span> {order.email}</div>}
              <div><span className="text-muted-foreground">Địa chỉ:</span> {order.address}</div>
              {order.city && <div><span className="text-muted-foreground">TP:</span> {order.city}</div>}
              {order.note && <div className="mt-2 rounded bg-neutral-50 p-2"><span className="text-muted-foreground">Ghi chú:</span> {order.note}</div>}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-5">
            <h2 className="mb-4 font-semibold">Cập nhật trạng thái</h2>
            <OrderStatusUpdater orderId={order.id} current={order.status} shipment={order.shipment ? { id: order.shipment.id, carrier: order.shipment.carrier, trackingCode: order.shipment.trackingCode } : null} />
          </div>
        </div>
      </div>
    </div>
  );
}
