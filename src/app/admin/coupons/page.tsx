import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CouponsManager } from "./coupons-manager";
import { Ticket } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    include: { _count: { select: { orders: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mã giảm giá</h1>
        <p className="text-sm text-muted-foreground">{coupons.length} mã</p>
      </div>

      <CouponsManager initialCoupons={coupons.map((c) => ({
        id: c.id,
        code: c.code,
        type: c.type,
        value: c.value,
        minOrder: c.minOrder,
        expiresAt: c.expiresAt?.toISOString() || null,
        usageLimit: c.usageLimit,
        usedCount: c.usedCount,
        active: c.active,
        orderCount: c._count.orders,
      }))} />

      {coupons.length === 0 && (
        <div className="rounded-lg border bg-white py-12 text-center text-muted-foreground">
          <Ticket className="mx-auto mb-2 h-8 w-8 opacity-50" />
          Chưa có mã giảm giá nào.
        </div>
      )}
    </div>
  );
}
