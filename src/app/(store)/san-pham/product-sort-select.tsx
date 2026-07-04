"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function ProductSortSelect({ value }: { value: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function changeSort(sort: string) {
    const qs = new URLSearchParams(searchParams.toString());
    if (sort === "newest") qs.delete("sort");
    else qs.set("sort", sort);
    qs.delete("page");
    const query = qs.toString();
    router.push(query ? `/san-pham?${query}` : "/san-pham");
  }

  return (
    <select
      id="sort"
      name="sort"
      value={value}
      onChange={(event) => changeSort(event.target.value)}
      className="h-10 min-w-0 flex-1 rounded-md border border-[#dce5f1] bg-white px-3 text-sm text-[#172033] outline-none focus:border-[#0757c9] sm:min-w-40 sm:flex-none"
    >
      <option value="newest">Mới nhất</option>
      <option value="price-asc">Giá thấp đến cao</option>
      <option value="price-desc">Giá cao đến thấp</option>
    </select>
  );
}
