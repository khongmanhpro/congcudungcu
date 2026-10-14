import { formatVND } from "@/lib/format";
import { SITE_NAME } from "@/lib/seo";
import { categoryUrl, effectivePrice, getCatalogForExport, productTitle, productUrl } from "@/lib/catalog-export";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

/** /llms-full.txt — toàn bộ catalog theo danh mục: tên, hãng, mã, giá/"Liên hệ", link. */
export async function GET() {
  const { categories, products } = await getCatalogForExport();
  const byCategory = new Map<string, typeof products>();
  for (const p of products) {
    const key = p.categoryId ?? "";
    byCategory.set(key, [...(byCategory.get(key) ?? []), p]);
  }

  const out = [`# ${SITE_NAME} (congcudungcu.vn) — danh sách sản phẩm`, "", `> ${products.length} sản phẩm chính hãng. Giá đã gồm VAT; "Liên hệ" = báo giá theo yêu cầu.`, ""];
  for (const c of categories) {
    const items = byCategory.get(c.id);
    if (!items?.length) continue;
    out.push(`## ${c.parent ? `${c.parent.name} › ` : ""}${c.name}`, `${categoryUrl(c)}`, "");
    for (const p of items) {
      const price = effectivePrice(p);
      const meta = [p.brand?.name, p.model ? `mã ${p.model}` : p.sku ? `mã ${p.sku}` : null, price > 0 ? formatVND(price) : "Liên hệ", p.stock > 0 ? null : "hết hàng"]
        .filter(Boolean)
        .join(" · ");
      out.push(`- [${productTitle(p)}](${productUrl(p)}) — ${meta}`);
    }
    out.push("");
  }

  return new Response(out.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
