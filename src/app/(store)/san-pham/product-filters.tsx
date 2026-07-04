"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Headphones, Menu, SlidersHorizontal, Wrench } from "lucide-react";

interface Props {
  categories: { id: string; name: string; slug: string; count: number }[];
  brands: { id: string; name: string; slug: string; count: number }[];
  current: { category?: string; brand?: string; minPrice?: number; maxPrice?: number; sort?: string; availability?: string };
}

function FiltersInner({ categories, brands, current }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [minPrice, setMinPrice] = useState(current.minPrice ? String(current.minPrice) : "100000");
  const [maxPrice, setMaxPrice] = useState(current.maxPrice ? String(current.maxPrice) : "50000000");
  const [showAllBrands, setShowAllBrands] = useState(false);
  const visibleBrands = showAllBrands ? brands : brands.slice(0, 5);

  function cleanPrice(value: string) {
    return value.replace(/[^\d]/g, "");
  }

  function apply(next: Record<string, string | null>) {
    const qs = new URLSearchParams(sp.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value) qs.set(key, value);
      else qs.delete(key);
    });
    qs.delete("page");
    const query = qs.toString();
    router.push(query ? `/san-pham?${query}` : "/san-pham");
  }

  return (
    <>
      <section className="overflow-hidden rounded-md border border-[#dce5f1] bg-white shadow-sm">
        <div className="flex items-center gap-2 bg-[#0757c9] px-4 py-3 text-sm font-black uppercase text-white">
          <Menu className="h-4 w-4" />
          Danh mục sản phẩm
        </div>
        <div className="divide-y divide-[#edf1f7]">
          {categories.slice(0, 12).map((category) => (
            <button
              key={category.id}
              onClick={() => apply({ category: current.category === category.id ? null : category.id })}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold transition hover:bg-[#f0f6ff] hover:text-[#0757c9] ${current.category === category.id ? "bg-[#f0f6ff] text-[#0757c9]" : "text-[#253044]"}`}
            >
              <Wrench className="h-4 w-4 shrink-0 text-[#667085]" />
              <span className="line-clamp-1 flex-1">{category.name}</span>
              <ChevronRight className="h-4 w-4 text-[#98a2b3]" />
            </button>
          ))}
        </div>
        <div className="p-3">
          <button onClick={() => apply({ category: null })} className="h-10 w-full rounded border border-[#0757c9] text-sm font-bold text-[#0757c9] hover:bg-[#f0f6ff]">
            Xem tất cả danh mục
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dce5f1] bg-white shadow-sm">
        <div className="flex items-center gap-2 bg-[#0757c9] px-4 py-3 text-sm font-black uppercase text-white">
          <SlidersHorizontal className="h-4 w-4" />
          Bộ lọc sản phẩm
        </div>

        <FilterGroup title="Thương hiệu">
          {visibleBrands.map((brand) => (
            <label key={brand.id} className="flex cursor-pointer items-center justify-between gap-3 text-sm text-[#344054]">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={current.brand === brand.id}
                  onChange={() => apply({ brand: current.brand === brand.id ? null : brand.id })}
                  className="h-4 w-4 rounded border-[#d0d5dd] accent-[#0757c9]"
                />
                {brand.name}
              </span>
              <span className="text-xs text-[#667085]">({brand.count})</span>
            </label>
          ))}
          {brands.length > 5 && (
            <button type="button" onClick={() => setShowAllBrands((value) => !value)} className="text-left text-xs font-bold text-[#0757c9]">
              {showAllBrands ? "- Thu gọn" : "+ Xem thêm"}
            </button>
          )}
        </FilterGroup>

        <FilterGroup title="Khoảng giá">
          <div className="relative h-5">
            <div className="absolute left-0 right-0 top-2 h-1 rounded bg-[#dbeafe]" />
            <div className="absolute left-0 right-0 top-2 h-1 rounded bg-[#0757c9]" />
            <div className="absolute left-0 top-0 h-5 w-5 rounded-full bg-[#0757c9]" />
            <div className="absolute right-0 top-0 h-5 w-5 rounded-full bg-[#0757c9]" />
          </div>
          <div className="text-center text-xs text-[#667085]">100,000đ - 50,000,000đ</div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <input
              className="h-10 min-w-0 rounded border border-[#dce5f1] px-3 text-sm"
              inputMode="numeric"
              value={minPrice}
              onChange={(event) => setMinPrice(cleanPrice(event.target.value))}
            />
            <span className="text-[#98a2b3]">-</span>
            <input
              className="h-10 min-w-0 rounded border border-[#dce5f1] px-3 text-sm"
              inputMode="numeric"
              value={maxPrice}
              onChange={(event) => setMaxPrice(cleanPrice(event.target.value))}
            />
          </div>
          <button onClick={() => apply({ minPrice: minPrice || null, maxPrice: maxPrice || null })} className="h-10 rounded bg-[#0757c9] text-sm font-bold text-white hover:bg-[#0048a8]">
            Lọc
          </button>
        </FilterGroup>

        <FilterGroup title="Trạng thái">
          {[
            ["Còn hàng", "in-stock", "256"],
            ["Hết hàng", "out-of-stock", "12"],
          ].map(([label, value, count]) => (
            <label key={label} className="flex cursor-pointer items-center justify-between text-sm text-[#344054]">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={current.availability === value}
                  onChange={() => apply({ availability: current.availability === value ? null : value })}
                  className="h-4 w-4 rounded border-[#d0d5dd] accent-[#0757c9]"
                />
                {label}
              </span>
              <span className="text-xs text-[#667085]">({count})</span>
            </label>
          ))}
        </FilterGroup>
      </section>

      <section className="rounded-md border border-[#dce5f1] bg-white p-4 text-center shadow-sm">
        <Headphones className="mx-auto h-8 w-8 text-[#0757c9]" />
        <h3 className="mt-2 text-sm font-black uppercase text-[#0757c9]">Cần tư vấn?</h3>
        <p className="mt-1 text-xs text-[#667085]">Đội ngũ chuyên viên sẵn sàng hỗ trợ bạn</p>
        <a href="tel:+84978390339" className="mt-4 flex h-10 items-center justify-center rounded bg-[#0757c9] text-sm font-bold text-white hover:bg-[#0048a8]">
          +84 978.39.03.39
        </a>
      </section>
    </>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 border-b border-[#edf1f7] p-4 last:border-b-0">
      <h3 className="text-sm font-black uppercase text-[#172033]">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

export function ProductFilters(props: Props) {
  return (
    <Suspense fallback={<div className="rounded-md border bg-white p-4 text-sm text-[#667085]">Đang tải...</div>}>
      <FiltersInner {...props} />
    </Suspense>
  );
}
