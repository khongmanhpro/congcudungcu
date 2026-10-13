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
  { key: "contact_zalo", label: "Zalo (link chat, vd https://zalo.me/0978390339)", type: "input" },
  { key: "social_messenger", label: "Messenger (link chat, vd https://m.me/tenpage)", type: "input" },
  { key: "seo_title", label: "SEO Title", type: "input" },
  { key: "seo_description", label: "SEO Description", type: "textarea" },
  { key: "vnpay_tmncode", label: "VNPay TmnCode", type: "input" },
  { key: "vnpay_hashsecret", label: "VNPay HashSecret", type: "input" },
  { key: "policy_warranty", label: "Chính sách bảo hành", type: "textarea" },
  { key: "policy_returns", label: "Chính sách đổi trả", type: "textarea" },
  { key: "policy_shipping", label: "Chính sách vận chuyển", type: "textarea" },
  { key: "policy_privacy", label: "Chính sách bảo mật", type: "textarea" },
  { key: "policy_sales", label: "Chính sách bán hàng", type: "textarea" },
  { key: "policy_payment", label: "Phương thức thanh toán", type: "textarea" },
  { key: "policy_dealer", label: "Trở thành đại lý", type: "textarea" },
  { key: "company_name", label: "Tên công ty (chân trang)", type: "input", hint: "Ví dụ: CÔNG TY CỔ PHẦN WORKMAN" },
  { key: "store_area", label: "Khu vực phục vụ (SEO địa phương)", type: "input", hint: "Ví dụ: TP.HCM, Bình Dương, Đồng Nai" },
  { key: "store_opening_hours", label: "Giờ mở cửa (định dạng cho Google)", type: "input", hint: "Ví dụ: Mo-Sa 07:30-17:30 (Mo=T2 … Su=CN)" },
  { key: "store_lat", label: "Vĩ độ cửa hàng", type: "input", hint: "Lấy từ Google Maps: chuột phải vào vị trí → số đầu tiên" },
  { key: "store_lng", label: "Kinh độ cửa hàng", type: "input" },
  { key: "store_map_url", label: "Link Google Maps / Google Business Profile", type: "input" },
  { key: "store_image", label: "Ảnh mặt tiền cửa hàng (URL)", type: "input" },
  { key: "home_banners", label: "Banner trang chủ", type: "textarea", hint: "Mỗi dòng 1 banner: link ảnh | tiêu đề | mô tả | link khi bấm. Để trống ảnh sẽ dùng banner màu kèm ảnh sản phẩm nổi bật." },
  { key: "home_youtube_videos", label: "Video / Hướng dẫn", type: "textarea", hint: "Mỗi dòng 1 video: link YouTube | tiêu đề" },
  { key: "footer_contacts", label: "Nhân viên kinh doanh (chân trang)", type: "textarea", hint: "Mỗi dòng: Tên | Số điện thoại" },
  { key: "footer_sites", label: "Website trong hệ thống (chân trang)", type: "textarea", hint: "Mỗi dòng: tên miền | link" },
];

const GROUPED_PREFIXES = ["seo_", "vnpay_", "policy_", "home_", "footer_", "company_", "store_"];
const isHomeField = (key: string) => ["home_", "footer_", "company_", "store_"].some((prefix) => key.startsWith(prefix));

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
          {FIELDS.filter((f) => !GROUPED_PREFIXES.some((prefix) => f.key.startsWith(prefix))).map((f) => (
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
        <h3 className="font-semibold">Trang chủ, chân trang &amp; cửa hàng</h3>
        {FIELDS.filter((f) => isHomeField(f.key)).map((f) => (
          <div key={f.key} className="space-y-2">
            <Label htmlFor={f.key}>{f.label}</Label>
            {f.type === "textarea" ? (
              <Textarea
                id={f.key}
                value={values[f.key] || ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                rows={4}
                className="font-mono text-xs"
              />
            ) : (
              <Input
                id={f.key}
                value={values[f.key] || ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              />
            )}
            {"hint" in f && <p className="text-xs text-muted-foreground">{f.hint}</p>}
          </div>
        ))}
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
