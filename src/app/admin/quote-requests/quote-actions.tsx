"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Phone, FileText, Check, Trash2 } from "lucide-react";

const statuses = [
  { value: "NEW", label: "Mới" },
  { value: "CONTACTED", label: "Đã liên hệ" },
  { value: "QUOTED", label: "Đã báo giá" },
  { value: "CLOSED", label: "Đã đóng" },
];

export function QuoteActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    const res = await fetch(`/api/quote-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) router.refresh();
    setLoading(false);
  }

  async function del() {
    if (!confirm("Xóa yêu cầu này?")) return;
    setLoading(true);
    const res = await fetch(`/api/quote-requests/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex shrink-0 flex-col gap-2">
      <select
        value={status}
        disabled={loading}
        onChange={(e) => updateStatus(e.target.value)}
        className="h-9 rounded-md border bg-white px-2 text-sm"
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <Button size="sm" variant="outline" onClick={del} disabled={loading}>
        <Trash2 className="h-4 w-4" /> Xóa
      </Button>
    </div>
  );
}
