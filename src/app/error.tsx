"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="text-5xl">:(</div>
      <h1 className="mt-4 text-2xl font-bold">Đã có lỗi xảy ra</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Trang gặp lỗi không mong muốn. Vui lòng thử lại hoặc về trang chủ.
      </p>
      {error.digest && <p className="mt-2 text-xs text-muted-foreground">Mã lỗi: {error.digest}</p>}
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Thử lại</Button>
        <Button variant="outline" asChild><Link href="/">Về trang chủ</Link></Button>
      </div>
    </div>
  );
}
