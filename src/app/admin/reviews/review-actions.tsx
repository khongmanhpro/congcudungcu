"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, X, Trash2 } from "lucide-react";

export function ReviewActions({ id, approved = false }: { id: string; approved?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function action(action: "approve" | "unapprove" | "delete") {
    setLoading(true);
    const res = await fetch(`/api/reviews/${id}`, {
      method: action === "delete" ? "DELETE" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: action === "delete" ? undefined : JSON.stringify({ approved: action === "approve" }),
    });
    if (res.ok) router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex shrink-0 gap-2">
      {!approved && (
        <Button size="sm" variant="outline" onClick={() => action("approve")} disabled={loading}>
          <Check className="h-4 w-4" /> Duyệt
        </Button>
      )}
      {approved && (
        <Button size="sm" variant="outline" onClick={() => action("unapprove")} disabled={loading}>
          <X className="h-4 w-4" /> Ẩn
        </Button>
      )}
      <Button size="icon" variant="destructive" onClick={() => action("delete")} disabled={loading}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
