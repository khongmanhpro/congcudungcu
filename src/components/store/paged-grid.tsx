"use client";

import { useState } from "react";

/** Lưới chia trang, chuyển trang bằng chấm tròn bên dưới (kiểu carousel). */
export function PagedGrid({ pages, className = "" }: { pages: React.ReactNode[]; className?: string }) {
  const [page, setPage] = useState(0);
  if (pages.length === 0) return null;

  return (
    <div>
      <div className={className}>{pages[Math.min(page, pages.length - 1)]}</div>
      {pages.length > 1 && (
        <div className="mt-2 flex justify-center">
          {pages.map((_, index) => (
            <button key={index} type="button" onClick={() => setPage(index)} aria-label={`Trang ${index + 1}`} className="grid h-6 min-w-6 place-items-center px-0.5">
              <span className={`block h-2 rounded-full transition-all ${index === page ? "w-4 bg-gold" : "w-2.5 bg-[#cbd5e1] hover:bg-[#94a3b8]"}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
