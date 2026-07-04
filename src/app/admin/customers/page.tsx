import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: { orders: { select: { id: true, total: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Khách hàng</h1>
        <p className="text-sm text-muted-foreground">{customers.length} khách</p>
      </div>
      {customers.length === 0 ? (
        <div className="rounded-lg border bg-white py-12 text-center text-muted-foreground">
          <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
          Chưa có khách hàng đăng ký.
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>SĐT</TableHead>
                <TableHead>Đơn hàng</TableHead>
                <TableHead>Ngày đăng ký</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => {
                const totalSpent = c.orders.filter((o) => o.status === "PAID" || o.status === "DELIVERED").reduce((s, o) => s + o.total, 0);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.email}</TableCell>
                    <TableCell>{c.name || "—"}</TableCell>
                    <TableCell className="text-sm">{c.phone || "—"}</TableCell>
                    <TableCell className="text-sm">
                      {c.orders.length} đơn · {new Intl.NumberFormat("vi-VN").format(totalSpent)}₫
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateTime(c.createdAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
