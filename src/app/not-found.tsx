import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="text-7xl font-bold text-primary">404</div>
      <h1 className="mt-4 text-2xl font-bold">Trang không tìm thấy</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Trang bạn tìm kiếm không tồn tại hoặc đã bị di chuyển. Về trang chủ để tiếp tục mua sắm.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild><Link href="/">Về trang chủ</Link></Button>
        <Button variant="outline" asChild><Link href="/san-pham">Xem sản phẩm</Link></Button>
      </div>
    </div>
  );
}
