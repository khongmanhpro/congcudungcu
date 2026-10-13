"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ReviewActions({ productId }: { productId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "approve" | "reject") {
    if (action === "reject" && !confirm("Loại bản nháp này? Sản phẩm sẽ quay về nội dung gốc và có thể viết lại sau.")) return;
    setBusy(action);
    setError(null);
    const res = await fetch(`/api/content-review/${productId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "Lỗi");
      setBusy(null);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={() => act("approve")} disabled={!!busy}>{busy === "approve" ? "Đang áp dụng…" : "Duyệt & áp dụng"}</Button>
      <Button size="sm" variant="outline" onClick={() => act("reject")} disabled={!!busy}>Loại</Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
