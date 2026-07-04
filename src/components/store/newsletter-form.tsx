"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");
    try {
      // Lưu newsletter email vào Setting hoặc gửi API
      await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus("ok");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "ok") {
    return <p className="text-sm text-white">Cảm ơn! Bạn đã đăng ký thành công.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md overflow-hidden rounded-md bg-white">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Nhập email của bạn..."
        required
        className="h-11 min-w-0 flex-1 border-0 px-4 text-sm text-[#1d2939] placeholder:text-[#98a2b3] focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="bg-[#ff7417] px-5 py-2 text-sm font-bold text-white hover:bg-[#ff6500] disabled:opacity-50"
      >
        {status === "sending" ? "..." : "Đăng ký"}
      </button>
    </form>
  );
}
