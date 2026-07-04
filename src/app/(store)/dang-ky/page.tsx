"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (res.ok) {
        router.push("/tai-khoan");
        router.refresh();
      } else {
        if (typeof d.error === "string") setError(d.error);
        else if (d.error && typeof d.error === "object") {
          const first = Object.values(d.error)[0];
          setError(Array.isArray(first) ? String(first[0]) : String(first));
        } else setError("Đăng ký thất bại");
      }
    } catch {
      setError("Lỗi mạng");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-center text-2xl font-bold">Đăng ký tài khoản</h1>

      <form onSubmit={submit} className="space-y-4 rounded-lg border bg-white p-6">
        <div className="space-y-2">
          <Label htmlFor="name">Họ tên *</Label>
          <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Số điện thoại</Label>
          <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu *</Label>
          <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          <p className="text-xs text-muted-foreground">Tối thiểu 6 ký tự</p>
        </div>

        {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Đang đăng ký..." : "Đăng ký"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Đã có tài khoản? <Link href="/dang-nhap" className="text-primary hover:underline">Đăng nhập</Link>
      </p>
    </div>
  );
}
