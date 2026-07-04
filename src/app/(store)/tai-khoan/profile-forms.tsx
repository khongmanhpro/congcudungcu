"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  user,
}: {
  user: { name: string | null; email: string; phone: string | null };
}) {
  const router = useRouter();
  const [form, setForm] = useState({ name: user.name || "", phone: user.phone || "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setErr(null);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, phone: form.phone || null }),
    });
    if (res.ok) {
      setMsg("Đã cập nhật thông tin");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setErr(typeof d.error === "string" ? d.error : "Lỗi cập nhật");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Họ tên</Label>
        <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={user.email} disabled className="bg-neutral-100" />
        <p className="text-xs text-muted-foreground">Không thể đổi email</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Số điện thoại</Label>
        <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>

      {msg && <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{msg}</div>}
      {err && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      <Button type="submit" disabled={saving}>{saving ? "..." : "Lưu thay đổi"}</Button>
    </form>
  );
}

export function PasswordForm() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      setErr("Mật khẩu xác nhận không khớp");
      return;
    }
    setSaving(true);
    setMsg(null);
    setErr(null);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "password",
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      }),
    });
    if (res.ok) {
      setMsg("Đã đổi mật khẩu");
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
    } else {
      const d = await res.json().catch(() => ({}));
      setErr(typeof d.error === "string" ? d.error : "Lỗi đổi mật khẩu");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cur">Mật khẩu hiện tại</Label>
        <Input id="cur" type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new">Mật khẩu mới</Label>
        <Input id="new" type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required minLength={6} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cf">Xác nhận mật khẩu mới</Label>
        <Input id="cf" type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
      </div>

      {msg && <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{msg}</div>}
      {err && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      <Button type="submit" disabled={saving}>{saving ? "..." : "Đổi mật khẩu"}</Button>
    </form>
  );
}
