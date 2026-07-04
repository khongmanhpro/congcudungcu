"use client";

import { GitCompare } from "lucide-react";
import { useCompare } from "@/lib/compare-store";

interface Props {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    salePrice: number | null;
    image: string | null;
    brand?: string | null;
    specs?: { label: string; value: string }[];
  };
  className?: string;
}

export function CompareButton({ product, className = "" }: Props) {
  const toggle = useCompare((s) => s.toggle);
  const has = useCompare((s) => s.has(product.id));

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          salePrice: product.salePrice,
          image: product.image,
          brand: product.brand || null,
          specs: product.specs || [],
        });
      }}
      className={`flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-neutral-50 ${className}`}
      aria-label={has ? "Bỏ so sánh" : "Thêm so sánh"}
    >
      <GitCompare className={`h-4 w-4 ${has ? "text-primary" : "text-neutral-500"}`} />
      <span className="hidden sm:inline">{has ? "Đã chọn" : "So sánh"}</span>
    </button>
  );
}
