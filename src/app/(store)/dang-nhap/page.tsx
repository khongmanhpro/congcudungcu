"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/tai-khoan";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/customer-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (res.ok) {
        router.push(next);
        router.refresh();
      } else {
        setError(d.error || "Đăng nhập thất bại");
      }
    } catch {
      setError("Lỗi mạng");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-center text-2xl font-bold">Đăng nhập</h1>

      <form onSubmit={submit} className="space-y-4 rounded-lg border bg-white p-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>

        {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "..." : "Đăng nhập"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Chưa có tài khoản? <Link href="/dang-ky" className="text-primary hover:underline">Đăng ký</Link>
      </p>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted-foreground">Đang tải...</div>}>
      <LoginInner />
    </Suspense>
  );
}
