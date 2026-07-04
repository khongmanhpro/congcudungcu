"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-store";
import { formatVND } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clear } = useCart();
  const t = total();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "VNPAY">("VNPAY");
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName, phone, email: email || null, address, city: city || null,
          note: note || null, paymentMethod, couponCode: couponCode || null,
          items: items.map((i) => ({
            id: i.id, name: i.name, slug: i.slug, price: i.price, salePrice: i.salePrice, qty: i.qty,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Đặt hàng thất bại");
        setLoading(false);
        return;
      }
      if (data.paymentUrl) {
        // Redirect VNPay
        window.location.href = data.paymentUrl;
      } else {
        // COD thành công
        clear();
        router.push(`/thanh-toan/thanh-cong?code=${data.order.code}`);
      }
    } catch {
      setError("Lỗi mạng");
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-neutral-300" />
        <h1 className="mb-2 text-2xl font-bold">Giỏ hàng trống</h1>
        <Button asChild><Link href="/san-pham">Mua sắm ngay</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">Thanh toán</h1>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="rounded-lg border bg-white p-5 space-y-4">
            <h2 className="font-semibold">Thông tin giao hàng</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerName">Họ tên *</Label>
                <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">SĐT *</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Tỉnh/Thành</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ chi tiết *</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="Số nhà, đường, phường..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Ghi chú</Label>
              <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
            </div>
          </div>

          <div className="rounded-lg border bg-white p-5 space-y-4">
            <h2 className="font-semibold">Phương thức thanh toán</h2>
            <label className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-neutral-50">
              <input type="radio" name="payment" value="VNPAY" checked={paymentMethod === "VNPAY"} onChange={() => setPaymentMethod("VNPAY")} />
              <div>
                <div className="font-medium">VNPay (thẻ tín dụng, QR, ngân hàng)</div>
                <div className="text-xs text-muted-foreground">Thanh toán online qua cổng VNPay</div>
              </div>
            </label>
            <label className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-neutral-50">
              <input type="radio" name="payment" value="COD" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} />
              <div>
                <div className="font-medium">COD — Nhận hàng trả tiền</div>
                <div className="text-xs text-muted-foreground">Thanh toán khi nhận hàng</div>
              </div>
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border bg-white p-5 space-y-3 h-fit">
            <h2 className="font-semibold">Đơn hàng</h2>
            <div className="space-y-2 text-sm">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between">
                  <span className="line-clamp-1">{i.name} × {i.qty}</span>
                  <span className="font-medium">{formatVND((i.salePrice ?? i.price) * i.qty)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="couponCode">Mã giảm giá</Label>
              <div className="flex gap-2">
                <Input id="couponCode" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="VD: SUMMER" />
              </div>
            </div>
            <div className="space-y-1 border-t pt-3 text-sm">
              <div className="flex justify-between"><span>Tạm tính</span><span>{formatVND(t)}</span></div>
              <div className="flex justify-between"><span>Phí ship</span><span>{formatVND(30000)}</span></div>
              <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Tổng</span><span className="text-primary">{formatVND(t + 30000)}</span></div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Đang xử lý..." : paymentMethod === "VNPAY" ? "Thanh toán với VNPay" : "Đặt hàng (COD)"}
            </Button>
            {error && <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}
          </div>
        </div>
      </form>
    </div>
  );
}
