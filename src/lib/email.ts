import nodemailer from "nodemailer";

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM || "no-reply@congcudungcu.vn";

  if (!host || !user || !pass) {
    return null; // email disabled
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

export async function sendMail(opts: MailOptions): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    console.log(`[email disabled] Would send to ${opts.to}: ${opts.subject}`);
    return false;
  }
  const from = process.env.SMTP_FROM || "no-reply@congcudungcu.vn";
  try {
    await t.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    return true;
  } catch (e) {
    console.error("[email] send error:", e);
    return false;
  }
}

export async function sendOrderConfirmationEmail(to: string, order: {
  code: string;
  total: number;
  customerName: string;
  items: { name: string; qty: number; price: number }[];
}) {
  const itemsHtml = order.items
    .map((i) => `<tr><td>${i.name}</td><td>${i.qty}</td><td>${i.price.toLocaleString("vi-VN")}đ</td><td>${(i.price * i.qty).toLocaleString("vi-VN")}đ</td></tr>`)
    .join("");

  return sendMail({
    to,
    subject: `Xác nhận đơn hàng ${order.code}`,
    html: `
      <h2>Cảm ơn ${order.customerName} đã đặt hàng!</h2>
      <p>Mã đơn hàng: <strong>${order.code}</strong></p>
      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
        <tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Tiền</th></tr>
        ${itemsHtml}
      </table>
      <p style="margin-top:16px;font-size:18px;"><strong>Tổng: ${order.total.toLocaleString("vi-VN")}đ</strong></p>
      <p>Chúng tôi sẽ liên hệ xác nhận và giao hàng sớm nhất.</p>
      <hr><p style="color:#999;font-size:12px;">congcudungcu.vn</p>
    `,
  });
}

export async function sendQuoteRequestNotification(quote: {
  name: string;
  phone: string;
  email?: string | null;
  company?: string | null;
  content: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false;

  return sendMail({
    to: adminEmail,
    subject: `Yêu cầu liên hệ mới từ ${quote.name}`,
    html: `
      <h2>Yêu cầu liên hệ/báo giá mới</h2>
      <p><strong>Khách hàng:</strong> ${quote.name}</p>
      <p><strong>SĐT:</strong> ${quote.phone}</p>
      ${quote.email ? `<p><strong>Email:</strong> ${quote.email}</p>` : ""}
      ${quote.company ? `<p><strong>Công ty:</strong> ${quote.company}</p>` : ""}
      <p><strong>Nội dung:</strong></p>
      <blockquote>${quote.content}</blockquote>
    `,
  });
}
