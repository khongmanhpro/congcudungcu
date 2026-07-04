import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendQuoteRequestNotification } from "@/lib/email";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(1),
  message: z.string().min(1),
  company: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const quote = await prisma.quoteRequest.create({
    data: {
      name: d.name,
      email: d.email || null,
      phone: d.phone,
      company: d.company || null,
      content: d.message,
      productId: d.productId || null,
      status: "NEW",
    },
  });

  // Gửi email thông báo cho admin (async)
  sendQuoteRequestNotification({
    name: d.name,
    phone: d.phone,
    email: d.email || null,
    company: d.company || null,
    content: d.message,
  }).catch(() => {});

  return NextResponse.json({ ok: true, id: quote.id }, { status: 201 });
}
