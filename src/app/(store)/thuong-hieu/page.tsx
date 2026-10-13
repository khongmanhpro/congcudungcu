import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { JsonLd, absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import { brandPath } from "@/lib/urls";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Thương hiệu dụng cụ chính hãng phân phối",
  description:
    "Các thương hiệu dụng cụ, thiết bị công nghiệp chính hãng phân phối tại congcudungcu.vn: KNIPEX, TOPTUL, WOKIN, BOSCH, MATADOR, STANLEY… Hóa đơn VAT, giao hàng toàn quốc.",
  alternates: { canonical: "/thuong-hieu" },
};

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({
    where: { products: { some: { status: "PUBLISHED" } } },
    select: { id: true, name: true, slug: true, logoUrl: true, country: true, _count: { select: { products: { where: { status: "PUBLISHED" } } } } },
  });
  brands.sort((a, b) => b._count.products - a._count.products);

  return (
    <div className="bg-[#f5f6f8] pb-8">
      <JsonLd
        data={[
          breadcrumbJsonLd([{ name: "Trang chủ", path: "/" }, { name: "Thương hiệu", path: "/thuong-hieu" }]),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Thương hiệu phân phối",
            itemListElement: brands.map((b, i) => ({ "@type": "ListItem", position: i + 1, url: absoluteUrl(brandPath(b.slug)), name: b.name })),
          },
        ]}
      />
      <div className="mx-auto max-w-7xl space-y-4 px-3 pt-3 sm:px-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-[#475569]">
          <Link href="/" className="hover:text-brand">Trang chủ</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-bold text-[#0f172a]">Thương hiệu</span>
        </nav>
        <section className="rounded-lg border border-gold bg-white p-4">
          <h1 className="text-2xl font-black text-[#0f172a]">Thương hiệu phân phối</h1>
          <p className="mt-1 text-sm text-[#475569]">{brands.length} thương hiệu dụng cụ & thiết bị công nghiệp chính hãng.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {brands.map((brand) => (
              <Link key={brand.id} href={brandPath(brand.slug)} className="flex flex-col items-center rounded-lg border border-[#e2e8f0] p-3 text-center transition hover:border-gold hover:shadow-md">
                <span className="grid h-12 place-items-center">
                  {brand.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={brand.logoUrl} alt={brand.name} className="max-h-12 max-w-full object-contain" />
                  ) : (
                    <span className="text-lg font-black uppercase text-brand">{brand.name}</span>
                  )}
                </span>
                <span className="mt-1 text-xs text-[#475569]">
                  {brand._count.products} sản phẩm{brand.country ? ` · ${brand.country}` : ""}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
