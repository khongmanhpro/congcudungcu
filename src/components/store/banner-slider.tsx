"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export type BannerSlide = {
  image?: string;
  /** ảnh nhỏ xếp bên phải khi không có ảnh banner */
  productImages?: string[];
  title: string;
  subtitle?: string;
  href?: string;
};

/** Slider banner trang chủ: ảnh rộng, chữ ở góc dưới trái, nút "Xem ngay", chấm chuyển slide. */
export function BannerSlider({ slides }: { slides: BannerSlide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <section className="relative aspect-[16/9] overflow-hidden rounded-md bg-brand-dark sm:aspect-[1176/366]">
      {slides.map((slide, i) => (
        <div key={i} className={`absolute inset-0 transition-opacity duration-700 ${i === index ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={i !== index} inert={i !== index}>
          {slide.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(226,167,73,.35),transparent_35%),linear-gradient(115deg,#061b3d_0%,#003869_60%,#0b4f8f_100%)]">
              <div className="absolute inset-y-6 right-6 hidden w-1/2 items-center justify-end gap-4 sm:flex">
                {(slide.productImages ?? []).slice(0, 3).map((src, k) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src} src={src} alt="" className={`aspect-square w-1/3 rounded-lg bg-white object-contain p-2 shadow-xl ${k === 1 ? "-translate-y-4" : "translate-y-3"}`} />
                ))}
              </div>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-5 pb-8 pt-16 sm:px-6">
            <p className="text-2xl font-black text-white drop-shadow sm:text-4xl">{slide.title}</p>
            {slide.subtitle && <p className="mt-1 text-sm font-medium text-white/90 sm:text-lg">{slide.subtitle}</p>}
          </div>
          {slide.href && (
            <Link href={slide.href} className="absolute bottom-4 right-4 rounded bg-gold px-3.5 py-2 text-xs font-bold text-brand-dark hover:bg-gold-dark">
              Xem ngay
            </Link>
          )}
        </div>
      ))}

      {slides.length > 1 && (
        <div className="absolute bottom-1.5 left-3.5 flex sm:left-4.5">
          {slides.map((_, i) => (
            <button key={i} type="button" onClick={() => setIndex(i)} aria-label={`Banner ${i + 1}`} className="grid h-6 w-6 place-items-center">
              <span className={`h-2.5 w-2.5 rounded-full border border-white transition ${i === index ? "bg-white" : "bg-white/20"}`} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
