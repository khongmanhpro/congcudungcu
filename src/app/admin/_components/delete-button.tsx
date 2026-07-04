"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteButton({
  endpoint,
  label,
  redirect,
}: {
  endpoint: string;
  label?: string;
  redirect?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const msg = label ? `Xóa ${label}? Không thể hoàn tác.` : "Xóa? Không thể hoàn tác.";
    if (!window.confirm(msg)) return;
    setLoading(true);
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Xóa thất bại");
        setLoading(false);
        return;
      }
      if (redirect) router.push(redirect);
      router.refresh();
    } catch {
      alert("Lỗi mạng");
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="destructive" onClick={handleDelete} disabled={loading}>
      <Trash2 className="h-4 w-4" />
      {loading ? "..." : "Xóa"}
    </Button>
  );
}
