import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto mb-4 h-20 w-20 text-green-600" />
      <h1 className="mb-2 text-2xl font-bold">Thanh toán thành công!</h1>
      {code && <p className="mb-6 text-muted-foreground">Mã đơn hàng: <span className="font-mono font-bold text-foreground">{code}</span></p>}
      <p className="mb-6 text-muted-foreground">Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ liên hệ để giao hàng sớm nhất.</p>
      <div className="flex justify-center gap-3">
        <Button asChild><Link href="/">Về trang chủ</Link></Button>
        <Button asChild variant="outline"><Link href="/san-pham">Tiếp tục mua</Link></Button>
      </div>
    </div>
  );
}
