"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });
      setStatus(res.ok ? "ok" : "error");
      if (res.ok) {
        setName(""); setEmail(""); setPhone(""); setMessage("");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-5">
      <h2 className="text-lg font-semibold">Gửi tin nhắn</h2>
      <div className="space-y-2">
        <Label htmlFor="name">Họ tên *</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">SĐT *</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Nội dung *</Label>
        <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={5} required />
      </div>
      <Button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Đang gửi..." : "Gửi tin nhắn"}
      </Button>
      {status === "ok" && <p className="text-sm text-green-600">Cảm ơn! Tin nhắn đã được gửi.</p>}
      {status === "error" && <p className="text-sm text-red-600">Có lỗi xảy ra, vui lòng thử lại.</p>}
    </form>
  );
}
