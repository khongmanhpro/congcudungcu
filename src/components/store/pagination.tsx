import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { pagedPath } from "@/lib/seo";

/** Phân trang dạng link thật (bot đi theo được); trang 1 không kèm ?page. */
export function Pagination({ path, page, totalPages }: { path: string; page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Phân trang" className="flex items-center justify-center gap-2 text-sm font-bold">
      {page > 1 && (
        <Link href={pagedPath(path, page - 1)} aria-label="Trang trước" className="grid h-9 w-9 place-items-center rounded-md bg-white text-brand hover:bg-brand-50">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
      <span className="rounded-md bg-brand px-3 py-2 text-white">{page} / {totalPages}</span>
      {page < totalPages && (
        <Link href={pagedPath(path, page + 1)} aria-label="Trang sau" className="grid h-9 w-9 place-items-center rounded-md bg-white text-brand hover:bg-brand-50">
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
