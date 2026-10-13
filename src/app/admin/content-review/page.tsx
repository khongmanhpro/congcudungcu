import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import type { DraftIssue, ProductDraft } from "@/lib/content-validate";
import { stripHtmlText } from "@/lib/content-validate";
import { productPath } from "@/lib/urls";
import { ReviewActions } from "./review-actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

type StoredDraft = { draft: ProductDraft; issues: DraftIssue[]; model?: string; createdAt?: string };

export default async function ContentReviewPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Number((await searchParams).page || "1") || 1);
  const [counts, drafts] = await Promise.all([
    prisma.product.groupBy({ by: ["contentStatus"], _count: { _all: true } }),
    prisma.product.findMany({
      where: { contentStatus: "AI_DRAFT" },
      select: { id: true, name: true, slug: true, shortDesc: true, description: true, aiDraft: true, brand: { select: { name: true } } },
    }),
  ]);
  const count = (s: string) => counts.find((c) => c.contentStatus === s)?._count._all ?? 0;

  // bản nháp có lỗi lên đầu để xem kỹ trước
  const sorted = drafts
    .map((p) => ({ ...p, stored: p.aiDraft as StoredDraft | null }))
    .filter((p) => p.stored?.draft)
    .sort((a, b) => b.stored!.issues.filter((i) => i.level === "error").length - a.stored!.issues.filter((i) => i.level === "error").length);
  const items = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Duyệt nội dung AI</h1>
        <p className="text-sm text-muted-foreground">
          Chờ duyệt: <strong>{count("AI_DRAFT")}</strong> · Đã duyệt: {count("REVIEWED")} · Nội dung gốc: {count("ORIGINAL")}.
          Tạo bản nháp bằng <code>pnpm exec tsx scripts/content/rewrite.ts</code>.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border bg-white py-12 text-center text-muted-foreground">Không có bản nháp nào chờ duyệt.</div>
      ) : (
        items.map((p) => {
          const { draft, issues } = p.stored!;
          return (
            <article key={p.id} className="space-y-3 rounded-lg border bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={productPath(p.slug)} target="_blank" className="font-semibold hover:underline">{p.name}</Link>
                  <p className="text-xs text-muted-foreground">{p.brand?.name ?? "Chưa rõ hãng"} · <Link href={`/admin/products/${p.id}/edit`} className="underline">Sửa sản phẩm</Link></p>
                </div>
                <ReviewActions productId={p.id} />
              </div>

              {issues.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                  {issues.map((issue, i) => (
                    <li key={i}><Badge variant={issue.level === "error" ? "destructive" : "warning"}>{issue.message}</Badge></li>
                  ))}
                </ul>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2 rounded-md bg-neutral-50 p-3 text-sm">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Nội dung hiện tại</p>
                  <p className="text-neutral-600">{p.shortDesc ? stripHtmlText(p.shortDesc) : <em>(không có mô tả ngắn)</em>}</p>
                  <p className="line-clamp-[12] whitespace-pre-line text-neutral-600">{stripHtmlText(p.description || "") || <em>(không có mô tả)</em>}</p>
                </div>
                <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50/40 p-3 text-sm">
                  <p className="text-xs font-semibold uppercase text-emerald-700">Bản nháp AI</p>
                  <p><strong>SEO title</strong> ({draft.seoTitle.length}): {draft.seoTitle}</p>
                  <p><strong>SEO description</strong> ({draft.seoDesc.length}): {draft.seoDesc}</p>
                  <p><strong>Mô tả ngắn:</strong> {draft.shortDesc}</p>
                  <details>
                    <summary className="cursor-pointer font-semibold">Mô tả chi tiết</summary>
                    <div className="prose prose-sm mt-2 max-w-none" dangerouslySetInnerHTML={{ __html: draft.descriptionHtml }} />
                  </details>
                  {draft.specs.length > 0 && (
                    <details>
                      <summary className="cursor-pointer font-semibold">Thông số ({draft.specs.length})</summary>
                      <ul className="mt-1 list-disc pl-5">{draft.specs.map((s, i) => <li key={i}>{s.label}: {s.value}</li>)}</ul>
                    </details>
                  )}
                  <details>
                    <summary className="cursor-pointer font-semibold">FAQ ({draft.faq.length})</summary>
                    <dl className="mt-1 space-y-1.5">{draft.faq.map((f, i) => <div key={i}><dt className="font-medium">{f.question}</dt><dd className="text-neutral-600">{f.answer}</dd></div>)}</dl>
                  </details>
                  <p className="text-xs text-muted-foreground">Alt ảnh: {draft.imageAlt}</p>
                </div>
              </div>
            </article>
          );
        })
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          {page > 1 && <Link href={`?page=${page - 1}`} className="rounded border px-3 py-1">← Trước</Link>}
          <span className="px-2 py-1">{page}/{totalPages}</span>
          {page < totalPages && <Link href={`?page=${page + 1}`} className="rounded border px-3 py-1">Sau →</Link>}
        </div>
      )}
    </div>
  );
}
