import Link from "next/link";
import { formatVND, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

interface OrderItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  code: string;
  status: string;
  total: number;
  createdAt: Date;
  items: OrderItem[];
}

interface Props {
  orders: Order[];
  total: number;
  totalPages: number;
  page: number;
  status?: string;
  statusOptions: string[];
  statusLabel: Record<string, string>;
}

export function OrdersList({
  orders,
  total,
  totalPages,
  page,
  status,
  statusOptions,
  statusLabel,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Filter */}
      <form className="flex flex-wrap gap-2" method="get">
        <input type="hidden" name="tab" value="orders" />
        <select name="status" defaultValue={status || ""} className="h-9 rounded-md border bg-white px-3 text-sm">
          <option value="">Tất cả trạng thái</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{statusLabel[s] || s}</option>
          ))}
        </select>
        <button type="submit" className="h-9 rounded-md border px-4 text-sm hover:bg-neutral-50">Lọc</button>
      </form>

      {orders.length === 0 ? (
        <div className="rounded-lg border bg-white py-12 text-center text-muted-foreground">
          Bạn chưa có đơn hàng nào. <Link href="/san-pham" className="text-primary hover:underline">Mua sắm ngay</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Link href={`/tra-cuu-don-hang?code=${o.code}`} className="font-mono font-bold hover:text-primary">
                    {o.code}
                  </Link>
                  <div className="text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</div>
                </div>
                <Badge variant={o.status === "DELIVERED" || o.status === "PAID" ? "success" : o.status === "CANCELLED" ? "destructive" : "warning"}>
                  {statusLabel[o.status] || o.status}
                </Badge>
              </div>
              <div className="mt-3 text-sm">
                {o.items.length} sản phẩm · <span className="font-bold text-primary">{formatVND(o.total)}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1 text-xs text-muted-foreground">
                {o.items.slice(0, 3).map((i) => (
                  <span key={i.id} className="rounded bg-neutral-100 px-2 py-0.5">{i.name} ×{i.qty}</span>
                ))}
                {o.items.length > 3 && <span className="px-2 py-0.5">+{o.items.length - 3} nữa</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/tai-khoan?tab=orders&page=${p}${status ? `&status=${status}` : ""}`}
              className={`rounded-md px-3 py-1 text-sm ${p === page ? "bg-primary text-white" : "border hover:bg-neutral-50"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
