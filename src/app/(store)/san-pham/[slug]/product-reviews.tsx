"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Review {
  id: string;
  rating: number;
  content: string | null;
  createdAt: string;
  user: { name: string | null };
}

export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/reviews?productId=${productId}`)
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews || []);
        setAvg(d.avg || 0);
        setCount(d.count || 0);
      })
      .catch(() => {
        setReviews([]);
        setAvg(0);
        setCount(0);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, content: content || null }),
      });
      const d = await res.json();
      if (res.ok) {
        setMsg("Cảm ơn! Đánh giá của bạn sẽ hiển thị sau khi được duyệt.");
        setShowForm(false);
        setContent("");
        setRating(5);
      } else {
        setMsg(typeof d.error === "string" ? d.error : "Lỗi gửi đánh giá");
      }
    } catch {
      setMsg("Lỗi mạng");
    }
    setSubmitting(false);
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Đánh giá sản phẩm</h2>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          Viết đánh giá
        </Button>
      </div>

      {/* Summary */}
      {count > 0 && (
        <div className="mb-4 flex items-center gap-4 rounded-lg border bg-white p-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{avg.toFixed(1)}</div>
            <div className="flex justify-center">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`h-4 w-4 ${i <= Math.round(avg) ? "fill-yellow-400 text-yellow-400" : "text-neutral-300"}`} />
              ))}
            </div>
            <div className="text-xs text-muted-foreground">{count} đánh giá</div>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-4 rounded-lg border bg-white p-5">
          <div className="space-y-2">
            <Label>Điểm đánh giá</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" onClick={() => setRating(i)}>
                  <Star className={`h-7 w-7 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-neutral-300 hover:text-yellow-400"}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-content">Nội dung (tùy chọn)</Label>
            <Textarea id="review-content" value={content} onChange={(e) => setContent(e.target.value)} rows={3} placeholder="Chia sẻ trải nghiệm của bạn..." />
          </div>
          <Button type="submit" disabled={submitting}>{submitting ? "Đang gửi..." : "Gửi đánh giá"}</Button>
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        </form>
      )}

      {/* List */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {(r.user.name || "U").charAt(0)}
                  </div>
                  <span className="font-medium">{r.user.name || "Ẩn danh"}</span>
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={`h-4 w-4 ${i <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-neutral-300"}`} />
                  ))}
                </div>
              </div>
              {r.content && <p className="mt-2 text-sm text-neutral-700">{r.content}</p>}
              <p className="mt-1 text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("vi-VN")}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
