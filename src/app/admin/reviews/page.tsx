import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ReviewActions } from "./review-actions";
import { Star } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    include: {
      product: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pending = reviews.filter((r) => !r.approved);
  const approved = reviews.filter((r) => r.approved);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Đánh giá sản phẩm</h1>
        <p className="text-sm text-muted-foreground">
          {pending.length} chờ duyệt · {approved.length} đã duyệt · {reviews.length} tổng
        </p>
      </div>

      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-warning">Chờ duyệt ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="rounded-lg border bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.user.name || r.user.email}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-neutral-300"}`} />
                        ))}
                      </div>
                      <Badge variant="warning">Chờ duyệt</Badge>
                    </div>
                    <a href={`/san-pham/${r.product.slug}`} className="mt-1 block text-sm text-primary hover:underline">
                      {r.product.name}
                    </a>
                    {r.content && <p className="mt-2 text-sm text-neutral-700">{r.content}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                  </div>
                  <ReviewActions id={r.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {approved.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Đã duyệt ({approved.length})</h2>
          <div className="space-y-3">
            {approved.map((r) => (
              <div key={r.id} className="rounded-lg border bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.user.name || r.user.email}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-neutral-300"}`} />
                        ))}
                      </div>
                      <Badge variant="success">Đã duyệt</Badge>
                    </div>
                    <a href={`/san-pham/${r.product.slug}`} className="mt-1 block text-sm text-primary hover:underline">
                      {r.product.name}
                    </a>
                    {r.content && <p className="mt-2 text-sm text-neutral-700">{r.content}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                  </div>
                  <ReviewActions id={r.id} approved />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {reviews.length === 0 && (
        <div className="rounded-lg border bg-white py-12 text-center text-muted-foreground">
          Chưa có đánh giá nào.
        </div>
      )}
    </div>
  );
}
