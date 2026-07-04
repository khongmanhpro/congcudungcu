"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type GalleryImage = {
  url: string;
  alt: string | null;
};

export function ProductGallery({ images, name, discount }: { images: GalleryImage[]; name: string; discount: number | null }) {
  const safeImages = images.length ? images : [{ url: "", alt: name }];
  const [active, setActive] = useState(0);
  const image = safeImages[active];

  function move(delta: number) {
    setActive((value) => (value + delta + safeImages.length) % safeImages.length);
  }

  return (
    <section className="overflow-hidden rounded-md border border-[#dce5f1] bg-white">
      <div className="relative aspect-square bg-white">
        {discount ? (
          <span className="absolute left-4 top-4 z-10 rounded bg-[#ef233c] px-3 py-1.5 text-sm font-black text-white">
            -{discount}%
          </span>
        ) : null}
        {image.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.url} alt={image.alt || name} className="h-full w-full object-contain p-5 sm:p-10" />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#f4f7fb] text-sm text-[#98a2b3]">Chưa có hình ảnh</div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-[#edf1f7] p-3 sm:gap-3 sm:p-4">
        <button type="button" onClick={() => move(-1)} className="grid h-9 w-9 shrink-0 place-items-center rounded border border-[#dce5f1] text-[#0757c9] hover:bg-[#f0f6ff]" aria-label="Ảnh trước">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="grid flex-1 grid-cols-5 gap-2 sm:gap-3">
          {safeImages.slice(0, 5).map((item, index) => (
            <button
              key={`${item.url}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={`aspect-square overflow-hidden rounded border bg-white p-1 transition ${active === index ? "border-[#0757c9] ring-1 ring-[#0757c9]" : "border-[#dce5f1] hover:border-[#0757c9]"}`}
              aria-label={`Xem ảnh ${index + 1}`}
            >
              {item.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt={item.alt || name} className="h-full w-full object-contain" />
              ) : null}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => move(1)} className="grid h-9 w-9 shrink-0 place-items-center rounded border border-[#dce5f1] text-[#0757c9] hover:bg-[#f0f6ff]" aria-label="Ảnh sau">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
