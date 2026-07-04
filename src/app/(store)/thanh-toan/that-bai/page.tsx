import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentFailedPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <XCircle className="mx-auto mb-4 h-20 w-20 text-red-600" />
      <h1 className="mb-2 text-2xl font-bold">Thanh toán thất bại</h1>
      <p className="mb-6 text-muted-foreground">Đã có lỗi xảy ra trong quá trình thanh toán. Đơn hàng của bạn vẫn được ghi nhận ở trạng thái chờ.</p>
      <div className="flex justify-center gap-3">
        <Button asChild><Link href="/gio-hang">Quay lại giỏ hàng</Link></Button>
        <Button asChild variant="outline"><Link href="/lien-he">Liên hệ hỗ trợ</Link></Button>
      </div>
    </div>
  );
}
