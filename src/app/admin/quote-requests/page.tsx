import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { QuoteActions } from "./quote-actions";

export const dynamic = "force-dynamic";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  NEW: { label: "Mới", variant: "warning" },
  CONTACTED: { label: "Đã liên hệ", variant: "secondary" },
  QUOTED: { label: "Đã báo giá", variant: "success" },
  CLOSED: { label: "Đã đóng", variant: "default" },
};

export default async function AdminQuoteRequestsPage() {
  const quotes = await prisma.quoteRequest.findMany({
    include: { product: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });

  const newCount = quotes.filter((q) => q.status === "NEW").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Liên hệ & Báo giá</h1>
        <p className="text-sm text-muted-foreground">
          {newCount} mới · {quotes.length} tổng
        </p>
      </div>

      {quotes.length === 0 ? (
        <div className="rounded-lg border bg-white py-12 text-center text-muted-foreground">
          Chưa có yêu cầu liên hệ nào.
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => {
            const st = statusMap[q.status] || { label: q.status, variant: "default" as const };
            return (
              <div key={q.id} className="rounded-lg border bg-white p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{q.name}</span>
                      <Badge variant={st.variant}>{st.label}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(q.createdAt)}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span>📞 {q.phone}</span>
                      {q.email && <span>✉️ {q.email}</span>}
                      {q.company && <span>🏢 {q.company}</span>}
                    </div>
                    {q.address && <p className="text-sm text-muted-foreground">📍 {q.address}</p>}
                    {q.product && (
                      <a href={`/san-pham/${q.product.slug}`} className="text-sm text-primary hover:underline">
                        Sản phẩm: {q.product.name}
                      </a>
                    )}
                    <p className="mt-2 rounded bg-neutral-50 p-2 text-sm">{q.content}</p>
                  </div>
                  <QuoteActions id={q.id} status={q.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
