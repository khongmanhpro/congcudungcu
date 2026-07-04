import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createVNPay } from "@/lib/vnpay";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vnpParams: Record<string, string> = {};
  searchParams.forEach((v, k) => { vnpParams[k] = v; });

  const vnpay = createVNPay();
  let result;
  try {
    result = vnpay.verifyReturnUrl(vnpParams as never);
  } catch {
    return NextResponse.redirect(new URL("/thanh-toan/that-bai", request.url));
  }

  if (!result.isSuccess) {
    return NextResponse.redirect(new URL("/thanh-toan/that-bai", request.url));
  }

  const orderCode = result.vnp_TxnRef as string | undefined;
  const order = await prisma.order.findUnique({
    where: { code: orderCode },
    include: { payment: true, items: true },
  });

  if (!order) {
    return NextResponse.redirect(new URL("/thanh-toan/that-bai", request.url));
  }

  // Cập nhật payment + order
  if (order.payment) {
    await prisma.payment.update({
      where: { id: order.payment.id },
      data: {
        status: "SUCCESS",
        vnpTxnNo: String(result.vnp_TransactionNo ?? ""),
        transactionId: order.code,
        paidAt: new Date(),
      },
    });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "PAID", paidAt: new Date() },
  });

  // Trừ kho
  for (const item of order.items) {
    if (!item.productId) continue;
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.qty } },
    });
  }

  // Tăng usedCount coupon
  if (order.couponId) {
    await prisma.coupon.update({
      where: { id: order.couponId },
      data: { usedCount: { increment: 1 } },
    });
  }

  const successUrl = new URL("/thanh-toan/thanh-cong", request.url);
  successUrl.searchParams.set("code", order.code);
  return NextResponse.redirect(successUrl);
}
