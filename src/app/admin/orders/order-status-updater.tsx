"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const STATUSES = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];
const LABELS: Record<string, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  PROCESSING: "Đang xử lý",
  SHIPPED: "Đã giao hàng",
  DELIVERED: "Đã nhận",
  CANCELLED: "Đã hủy",
  REFUNDED: "Hoàn tiền",
};

interface Props {
  orderId: string;
  current: string;
  shipment?: { id: string; carrier: string | null; trackingCode: string | null } | null;
}

export function OrderStatusUpdater({ orderId, current, shipment }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [carrier, setCarrier] = useState(shipment?.carrier || "");
  const [trackingCode, setTrackingCode] = useState(shipment?.trackingCode || "");
  const [saving, setSaving] = useState(false);

  async function update() {
    setSaving(true);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, carrier: carrier || null, trackingCode: trackingCode || null }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      alert("Lỗi cập nhật");
    }
    setSaving(false);
  }

  function print() {
    window.print();
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{LABELS[s]}</option>)}
        </select>
        <Button onClick={update} disabled={saving || (status === current && carrier === (shipment?.carrier || "") && trackingCode === (shipment?.trackingCode || ""))}>
          {saving ? "..." : "Lưu"}
        </Button>
      </div>

      {(status === "SHIPPED" || status === "DELIVERED" || shipment) && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-xs font-semibold text-muted-foreground">Vận chuyển</p>
          <input
            type="text"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder="Đơn vị VC (GHTK, J&T...)"
            className="h-9 w-full rounded-md border px-3 text-sm"
          />
          <input
            type="text"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            placeholder="Mã vận đơn"
            className="h-9 w-full rounded-md border px-3 text-sm"
          />
        </div>
      )}

      <Button variant="outline" onClick={print} className="w-full print:hidden">
        <Printer className="h-4 w-4" /> In đơn hàng
      </Button>
    </div>
  );
}
