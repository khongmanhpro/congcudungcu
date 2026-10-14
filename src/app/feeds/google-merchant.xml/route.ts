import { absoluteUrl } from "@/lib/seo";
import { effectivePrice, getCatalogForExport, productSummary, productTitle, productUrl } from "@/lib/catalog-export";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const esc = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/**
 * Feed Google Merchant Center (RSS 2.0 + g:). Chỉ sản phẩm có giá, còn hàng, có ảnh
 * (sản phẩm "Liên hệ" không đủ điều kiện hiển thị trên Shopping).
 * Khai báo trong Merchant Center: Nguồn dữ liệu → Tìm nạp theo lịch → https://congcudungcu.vn/feeds/google-merchant.xml
 */
export async function GET() {
  const { categories, products } = await getCatalogForExport();
  const catById = new Map(categories.map((c) => [c.id, c]));

  const items = products
    .filter((p) => p.price > 0 && p.stock > 0 && p.images.length > 0)
    .map((p) => {
      const cat = p.categoryId ? catById.get(p.categoryId) : undefined;
      const productType = cat ? [cat.parent?.name, cat.name].filter(Boolean).join(" > ") : "";
      const onSale = effectivePrice(p) < p.price;
      const mpn = p.model || p.sku;
      const fields = [
        ["g:id", p.sku || p.id],
        ["g:title", productTitle(p).slice(0, 150)],
        ["g:description", (productSummary(p, 4900) || productTitle(p)).slice(0, 5000)],
        ["g:link", productUrl(p)],
        ["g:image_link", absoluteUrl(p.images[0].url)],
        ...p.images.slice(1).map((img) => ["g:additional_image_link", absoluteUrl(img.url)]),
        ["g:availability", "in_stock"],
        ["g:condition", "new"],
        ["g:price", `${p.price} VND`],
        ...(onSale ? [["g:sale_price", `${effectivePrice(p)} VND`]] : []),
        ...(p.brand ? [["g:brand", p.brand.name]] : []),
        ...(p.gtin ? [["g:gtin", p.gtin]] : []),
        ...(mpn ? [["g:mpn", mpn]] : []),
        // không có GTIN và không có (hãng + MPN) → báo cho Google biết là không có mã định danh
        ...(!p.gtin && !(p.brand && mpn) ? [["g:identifier_exists", "no"]] : []),
        ...(productType ? [["g:product_type", productType]] : []),
      ];
      return `<item>${fields.map(([k, v]) => `<${k}>${esc(String(v))}</${k}>`).join("")}</item>`;
    });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>congcudungcu.vn</title><link>${esc(absoluteUrl("/"))}</link><description>Dụng cụ &amp; thiết bị công nghiệp chính hãng</description>
${items.join("\n")}
</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
