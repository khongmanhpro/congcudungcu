"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, X } from "lucide-react";
import { formatVND } from "@/lib/format";

interface CouponItem {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  expiresAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  active: boolean;
  orderCount: number;
}

export function CouponsManager({ initialCoupons }: { initialCoupons: CouponItem[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState("PERCENT");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("0");
  const [expiresAt, setExpiresAt] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          type,
          value: Number(value),
          minOrder: Number(minOrder),
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          usageLimit: usageLimit ? Number(usageLimit) : null,
          active: true,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setCode(""); setValue(""); setMinOrder("0"); setExpiresAt(""); setUsageLimit("");
        router.refresh();
      } else {
        const d = await res.json().catch(() => null);
        alert(d?.error || "Lỗi tạo mã");
      }
    } catch {
      alert("Lỗi mạng");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa mã giảm giá?")) return;
    const res = await fetch(`/api/coupons/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  async function toggleActive(c: CouponItem) {
    const res = await fetch(`/api/coupons/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !c.active }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Tạo mã
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Mã giảm giá mới</h3>
            <button type="button" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="code">Mã *</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required placeholder="SUMMER2026" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Loại</Label>
              <select id="type" value={type} onChange={(e) => setType(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="PERCENT">Phần trăm (%)</option>
                <option value="FIXED">Số tiền (VND)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Giá trị *</Label>
              <Input id="value" type="number" value={value} onChange={(e) => setValue(e.target.value)} required placeholder={type === "PERCENT" ? "10" : "50000"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minOrder">Đơn tối thiểu (VND)</Label>
              <Input id="minOrder" type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usageLimit">Giới hạn lượt dùng</Label>
              <Input id="usageLimit" type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder="Không giới hạn" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Hết hạn</Label>
              <Input id="expiresAt" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
          </div>
          <Button type="submit" disabled={saving}>{saving ? "Đang tạo..." : "Tạo mã"}</Button>
        </form>
      )}

      {initialCoupons.length > 0 && (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Giá trị</TableHead>
                <TableHead>Đơn tối thiểu</TableHead>
                <TableHead>Đã dùng</TableHead>
                <TableHead>Hết hạn</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialCoupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-bold">{c.code}</TableCell>
                  <TableCell className="text-sm">{c.type === "PERCENT" ? "%" : "VND"}</TableCell>
                  <TableCell className="font-medium">{c.type === "PERCENT" ? `${c.value}%` : formatVND(c.value)}</TableCell>
                  <TableCell className="text-sm">{formatVND(c.minOrder)}</TableCell>
                  <TableCell className="text-sm">{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ""} ({c.orderCount} đơn)</TableCell>
                  <TableCell className="text-sm">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("vi-VN") : "—"}</TableCell>
                  <TableCell>
                    <button onClick={() => toggleActive(c)}>
                      <Badge variant={c.active ? "success" : "secondary"}>{c.active ? "Hoạt động" : "Tắt"}</Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="destructive" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
