"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const FIELDS = [
  { key: "site_name", label: "Tên cửa hàng", type: "input" },
  { key: "site_tagline", label: "Slogan", type: "input" },
  { key: "contact_email", label: "Email liên hệ", type: "input" },
  { key: "contact_phone", label: "SĐT liên hệ", type: "input" },
  { key: "contact_hotline", label: "Hotline", type: "input" },
  { key: "business_hours", label: "Giờ làm việc", type: "input" },
  { key: "contact_address", label: "Địa chỉ", type: "input" },
  { key: "social_facebook", label: "Facebook URL", type: "input" },
  { key: "social_youtube", label: "YouTube URL", type: "input" },
  { key: "seo_title", label: "SEO Title", type: "input" },
  { key: "seo_description", label: "SEO Description", type: "textarea" },
  { key: "vnpay_tmncode", label: "VNPay TmnCode", type: "input" },
  { key: "vnpay_hashsecret", label: "VNPay HashSecret", type: "input" },
  { key: "policy_warranty", label: "Chính sách bảo hành", type: "textarea" },
  { key: "policy_returns", label: "Chính sách đổi trả", type: "textarea" },
  { key: "policy_shipping", label: "Chính sách vận chuyển", type: "textarea" },
  { key: "policy_privacy", label: "Chính sách bảo mật", type: "textarea" },
];

export function SettingsForm({ initial }: { initial: Record<string, string> }) {
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) setMsg("Đã lưu cài đặt");
      else setMsg("Lỗi lưu");
    } catch {
      setMsg("Lỗi mạng");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border bg-white p-5 space-y-4">
        <h3 className="font-semibold">Thông tin chung</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {FIELDS.slice(0, 9).map((f) => (
            <div key={f.key} className="space-y-2">
              <Label htmlFor={f.key}>{f.label}</Label>
              <Input
                id={f.key}
                value={values[f.key] || ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-5 space-y-4">
        <h3 className="font-semibold">SEO</h3>
        {FIELDS.filter((f) => f.key.startsWith("seo_")).map((f) => (
          <div key={f.key} className="space-y-2">
            <Label htmlFor={f.key}>{f.label}</Label>
            {f.type === "textarea" ? (
              <Textarea
                id={f.key}
                value={values[f.key] || ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                rows={3}
              />
            ) : (
              <Input
                id={f.key}
                value={values[f.key] || ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-white p-5 space-y-4">
        <h3 className="font-semibold">Cổng thanh toán VNPay</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {FIELDS.filter((f) => f.key.startsWith("vnpay_")).map((f) => (
            <div key={f.key} className="space-y-2">
              <Label htmlFor={f.key}>{f.label}</Label>
              <Input
                id={f.key}
                value={values[f.key] || ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Lưu ý: Nên đặt VNPay HashSecret trong biến môi trường (.env) thay vì DB cho production.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-5 space-y-4">
        <h3 className="font-semibold">Trang chính sách</h3>
        <p className="text-xs text-muted-foreground">
          Nội dung hiển thị tại /chinh-sach-bao-hanh, /chinh-sach-doi-tra, /van-chuyen, /chinh-sach-bao-mat. Để trống sẽ dùng nội dung mặc định.
        </p>
        {FIELDS.filter((f) => f.key.startsWith("policy_")).map((f) => (
          <div key={f.key} className="space-y-2">
            <Label htmlFor={f.key}>{f.label}</Label>
            <Textarea
              id={f.key}
              value={values[f.key] || ""}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              rows={5}
            />
          </div>
        ))}
      </div>

      {msg && <div className="rounded-md bg-neutral-100 p-3 text-sm">{msg}</div>}
      <Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu cài đặt"}</Button>
    </form>
  );
}
