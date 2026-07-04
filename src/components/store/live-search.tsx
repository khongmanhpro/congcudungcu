"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { formatVND } from "@/lib/format";

interface Suggestion {
  products: { id: string; name: string; slug: string; price: number; salePrice: number | null }[];
  categories: { id: string; name: string; slug: string }[];
}

type SearchCategory = { id: string; name: string; slug: string };

export function LiveSearch({ categories = [] }: { categories?: SearchCategory[] }) {
  const [q, setQ] = useState("");
  const [data, setData] = useState<Suggestion | null>(null);
  const [open, setOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) return;

    debounceRef.current = setTimeout(async () => {
      try {
        const categoryQuery = selectedCategory ? `&category=${encodeURIComponent(selectedCategory.id)}` : "";
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}${categoryQuery}`);
        if (res.ok) setData(await res.json());
      } catch {}
      setLoading(false);
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, selectedCategory]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCategoryOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();

    if (query) {
      const params = new URLSearchParams({ q: query });
      if (selectedCategory) params.set("category", selectedCategory.id);
      router.push(`/tim-kiem?${params.toString()}`);
      setOpen(false);
      setCategoryOpen(false);
      return;
    }

    if (selectedCategory) {
      router.push(`/san-pham?category=${encodeURIComponent(selectedCategory.id)}`);
      setOpen(false);
      setCategoryOpen(false);
    }
  }

  function selectCategory(category: SearchCategory | null) {
    setSelectedCategory(category);
    setCategoryOpen(false);
    if (q.length >= 2) {
      setLoading(true);
      setOpen(true);
    }
  }

  const hasResults = data && (data.products.length > 0 || data.categories.length > 0);

  return (
    <div ref={containerRef} className="relative order-3 w-full max-w-2xl flex-none md:order-none md:flex-1">
      <form onSubmit={submit}>
        <div className="relative flex h-11 overflow-visible rounded-md border border-[#dce5f1] bg-white shadow-sm md:h-12">
          <input
            type="search"
            value={q}
            onChange={(e) => {
              const nextQuery = e.target.value;
              setQ(nextQuery);
              setCategoryOpen(false);
              setOpen(true);
              if (nextQuery.length < 2) {
                setData(null);
                setLoading(false);
              } else {
                setLoading(true);
              }
            }}
            onFocus={() => setOpen(true)}
            placeholder="Bạn cần tìm sản phẩm gì..."
            className="h-full min-w-0 flex-1 rounded-l-md border-0 bg-white px-3 text-sm focus:outline-none sm:px-5"
          />

          <div className="relative hidden h-full shrink-0 lg:block">
            <button
              type="button"
              onClick={() => {
                setCategoryOpen((value) => !value);
                setOpen(false);
              }}
              className="flex h-full min-w-44 items-center justify-between gap-2 border-l border-[#edf1f7] px-4 text-sm font-medium text-[#344054] hover:bg-[#f8fbff] hover:text-[#0757c9]"
              aria-expanded={categoryOpen}
            >
              <span className="line-clamp-1 max-w-36 text-left">{selectedCategory?.name || "Tất cả danh mục"}</span>
              <ChevronDown className={`h-4 w-4 transition ${categoryOpen ? "rotate-180" : ""}`} />
            </button>

            {categoryOpen && (
              <div className="absolute right-0 top-full z-[70] mt-2 w-64 overflow-hidden rounded-md border border-[#dce5f1] bg-white shadow-xl">
                <button
                  type="button"
                  onClick={() => selectCategory(null)}
                  className={`block w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-[#f0f6ff] hover:text-[#0757c9] ${!selectedCategory ? "bg-[#f0f6ff] text-[#0757c9]" : "text-[#344054]"}`}
                >
                  Tất cả danh mục
                </button>
                <div className="max-h-80 overflow-y-auto border-t border-[#edf1f7]">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => selectCategory(category)}
                      className={`block w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-[#f0f6ff] hover:text-[#0757c9] ${selectedCategory?.id === category.id ? "bg-[#f0f6ff] text-[#0757c9]" : "text-[#344054]"}`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="flex h-full w-12 shrink-0 items-center justify-center rounded-r-md bg-[#0757c9] text-white hover:bg-[#0048a8] md:w-14">
            <Search className="h-5 w-5" />
          </button>
        </div>
      </form>

      {open && q.length >= 2 && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-[#dce5f1] bg-white shadow-xl">
          {loading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">Đang tìm...</div>
          ) : !hasResults ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">Không tìm thấy kết quả cho &quot;{q}&quot;</div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {data!.categories.length > 0 && !selectedCategory && (
                <div className="border-b">
                  <p className="px-4 py-2 text-xs font-semibold text-muted-foreground">Danh mục</p>
                  {data!.categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/danh-muc/${c.slug}`}
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2 text-sm hover:bg-neutral-50"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
              {data!.products.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-xs font-semibold text-muted-foreground">
                    Sản phẩm{selectedCategory ? ` trong ${selectedCategory.name}` : ""}
                  </p>
                  {data!.products.map((p) => {
                    const price = p.salePrice && p.salePrice > 0 ? p.salePrice : p.price;
                    return (
                      <Link
                        key={p.id}
                        href={`/san-pham/${p.slug}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between px-4 py-2 text-sm hover:bg-neutral-50"
                      >
                        <span className="line-clamp-1">{p.name}</span>
                        <span className="ml-2 shrink-0 font-medium text-primary">{price > 0 ? formatVND(price) : "Liên hệ"}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
              <Link
                href={`/tim-kiem?${new URLSearchParams({
                  q,
                  ...(selectedCategory ? { category: selectedCategory.id } : {}),
                }).toString()}`}
                onClick={() => setOpen(false)}
                className="block border-t bg-neutral-50 px-4 py-2 text-center text-sm font-medium text-primary hover:bg-neutral-100"
              >
                Xem tất cả kết quả →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
