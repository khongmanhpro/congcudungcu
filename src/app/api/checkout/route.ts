import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createVNPay, ProductCode, VnpLocale } from "@/lib/vnpay";
import { dateFormat } from "vnpay";
import { getSession } from "@/lib/session";
import { sendOrderConfirmationEmail } from "@/lib/email";

const schema = z.object({
  customerName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().nullable(),
  address: z.string().min(1),
  city: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  paymentMethod: z.enum(["COD", "VNPAY"]).default("COD"),
  couponCode: z.string().optional().nullable(),
  // Items truyền từ client (đồng bộ với cart)
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      price: z.number(),
      salePrice: z.number().nullable(),
      qty: z.number().int().min(1),
    }),
  ),
});

function generateOrderCode(): string {
  const d = new Date();
  const y = d.getFullYear().toString().slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DH${y}${m}${dd}${rand}`;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  if (d.items.length === 0) {
    return NextResponse.json({ error: "Giỏ hàng trống" }, { status: 400 });
  }

  // Tính tổng
  let subtotal = 0;
  const orderItems = [];
  for (const item of d.items) {
    const product = await prisma.product.findUnique({ where: { id: item.id } });
    if (!product) {
      return NextResponse.json({ error: `Sản phẩm không tồn tại: ${item.name}` }, { status: 400 });
    }
    if (product.stock < item.qty) {
      return NextResponse.json({ error: `Không đủ hàng: ${product.name} (còn ${product.stock})` }, { status: 400 });
    }
    const price = product.salePrice ?? product.price;
    subtotal += price * item.qty;
    orderItems.push({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price,
      qty: item.qty,
    });
  }

  // Coupon
  let discount = 0;
  let couponId: string | null = null;
  if (d.couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: d.couponCode.toUpperCase() } });
    if (coupon && coupon.active && (coupon.expiresAt ? coupon.expiresAt > new Date() : true)) {
      if (subtotal >= coupon.minOrder) {
        if (coupon.type === "PERCENT") {
          discount = Math.round((subtotal * coupon.value) / 100);
        } else {
          discount = coupon.value;
        }
        couponId = coupon.id;
      }
    }
  }

  const shippingFee = 30000; // phí ship cố định demo
  const total = subtotal - discount + shippingFee;
  const code = generateOrderCode();

  // Lấy user nếu đăng nhập
  const session = await getSession();
  const customerId = session?.userId || null;

  // Tạo order trong DB
  const order = await prisma.order.create({
    data: {
      code,
      customerName: d.customerName,
      phone: d.phone,
      email: d.email || null,
      address: d.address,
      city: d.city || null,
      note: d.note || null,
      subtotal,
      discount,
      shippingFee,
      total,
      status: d.paymentMethod === "VNPAY" ? "PENDING" : "PENDING",
      customerId,
      couponId,
      items: { create: orderItems },
    },
    include: { items: true },
  });

  // COD: trả về order, frontend hiện thông báo
  if (d.paymentMethod === "COD") {
    // Gửi email xác nhận (async, không block)
    if (d.email) {
      sendOrderConfirmationEmail(d.email, {
        code: order.code,
        total: order.total,
        customerName: order.customerName,
        items: order.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
      }).catch(() => {});
    }
    return NextResponse.json({ order, paymentUrl: null });
  }

  // VNPay: tạo payment + payment record
  const vnpay = createVNPay();
  const ipAddr = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const returnUrl = process.env.VNPAY_RETURN_URL || `${request.nextUrl.origin}/thanh-toan/ket-qua`;

  const paymentUrl = vnpay.buildPaymentUrl({
    vnp_Amount: total,
    vnp_IpAddr: ipAddr,
    vnp_TxnRef: order.code,
    vnp_OrderInfo: `Thanh toan don hang ${order.code}`,
    vnp_OrderType: ProductCode.Other,
    vnp_ReturnUrl: returnUrl,
    vnp_Locale: VnpLocale.VN,
    vnp_CreateDate: dateFormat(new Date()),
  });

  // Tạo payment record PENDING
  await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: "VNPAY",
      amount: total,
      status: "PENDING",
    },
  });

  return NextResponse.json({ order, paymentUrl });
}
