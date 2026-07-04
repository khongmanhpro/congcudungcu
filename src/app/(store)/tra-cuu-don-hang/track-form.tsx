"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function TrackForm({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode);
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim()) {
      router.push(`/tra-cuu-don-hang?code=${encodeURIComponent(code.trim())}`);
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Nhập mã đơn hàng hoặc số điện thoại..."
        className="h-11 flex-1 rounded-md border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <Button type="submit" size="lg">
        <Search className="h-4 w-4" /> Tra cứu
      </Button>
    </form>
  );
}
