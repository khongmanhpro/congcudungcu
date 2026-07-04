import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { formatVND, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";
import { ProfileForm, PasswordForm } from "./profile-forms";
import { OrdersList } from "./orders-list";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  PENDING: "Chờ xử lý",
  PAID: "Đã thanh toán",
  PROCESSING: "Đang xử lý",
  SHIPPED: "Đã giao hàng",
  DELIVERED: "Đã nhận",
  CANCELLED: "Đã hủy",
  REFUNDED: "Hoàn tiền",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap?next=/tai-khoan");

  const sp = await searchParams;
  const tab = sp.tab || "orders";
  const status = sp.status;
  const page = Number(sp.page || "1");
  const pageSize = 10;

  const where: Record<string, unknown> = { customerId: user.id };
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);
  const statusOptions = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">Tài khoản của tôi</h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b">
        <Link
          href="/tai-khoan?tab=orders"
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === "orders" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Đơn hàng ({total})
        </Link>
        <Link
          href="/tai-khoan?tab=profile"
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === "profile" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Thông tin cá nhân
        </Link>
        <Link
          href="/tai-khoan?tab=password"
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === "password" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Đổi mật khẩu
        </Link>
      </div>

      {tab === "orders" && (
        <OrdersList
          orders={orders}
          total={total}
          totalPages={totalPages}
          page={page}
          status={status}
          statusOptions={statusOptions}
          statusLabel={statusLabel}
        />
      )}

      {tab === "profile" && (
        <div className="max-w-md rounded-lg border bg-white p-6">
          <ProfileForm user={user} />
        </div>
      )}

      {tab === "password" && (
        <div className="max-w-md rounded-lg border bg-white p-6">
          <PasswordForm />
        </div>
      )}
    </div>
  );
}
