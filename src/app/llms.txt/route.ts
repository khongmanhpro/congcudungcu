import { getSettings } from "@/components/store/layout";
import { POLICIES } from "@/lib/policies";
import { SITE_NAME, absoluteUrl } from "@/lib/seo";
import { brandPath } from "@/lib/urls";
import { categoryUrl, getCatalogForExport } from "@/lib/catalog-export";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

/** /llms.txt — tóm tắt site cho AI (chuẩn llmstxt.org): giới thiệu, danh mục, thương hiệu, thông tin mua hàng. */
export async function GET() {
  const [{ categories, products, brands }, s] = await Promise.all([getCatalogForExport(), getSettings()]);
  const countByCategory = new Map<string, number>();
  const parentOf = new Map(categories.map((c) => [c.id, c.parentId]));
  for (const p of products) {
    for (let id = p.categoryId; id; id = parentOf.get(id) ?? null) countByCategory.set(id, (countByCategory.get(id) ?? 0) + 1);
  }
  const roots = categories.filter((c) => !c.parentId && (countByCategory.get(c.id) ?? 0) > 0);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id && (countByCategory.get(c.id) ?? 0) > 0);

  const lines: (string | null)[] = [
    `# ${s.company_name || SITE_NAME} (congcudungcu.vn)`,
    "",
    `> Nhà phân phối dụng cụ cầm tay, dụng cụ điện, khí nén, máy hàn, thiết bị đo lường và thiết bị garage chính hãng tại Việt Nam. ${products.length} sản phẩm từ ${brands.length} thương hiệu (${brands.slice(0, 6).map((b) => b.name).join(", ")}…). Có hóa đơn VAT, giao hàng toàn quốc, báo giá nhanh cho doanh nghiệp, đại lý và dự án.`,
    "",
    `- Hotline: ${s.contact_hotline || "0978.39.03.39"}`,
    s.contact_email ? `- Email: ${s.contact_email}` : null,
    s.contact_address ? `- Địa chỉ: ${s.contact_address}` : null,
    `- Khu vực phục vụ: ${s.store_area || "TP.HCM, Bình Dương"} và toàn quốc`,
    "- Thanh toán: COD, VNPay, chuyển khoản. Sản phẩm ghi \"Liên hệ\" là báo giá theo yêu cầu.",
    "",
    "## Danh mục sản phẩm",
    "",
    ...roots.flatMap((root) => [
      `- [${root.name}](${categoryUrl(root)}): ${countByCategory.get(root.id)} sản phẩm${root.intro ? ` — ${root.intro}` : ""}`,
      ...childrenOf(root.id).map((c) => `  - [${c.name}](${categoryUrl(c)}): ${countByCategory.get(c.id)} sản phẩm`),
    ]),
    "",
    "## Thương hiệu",
    "",
    ...brands.map((b) => `- [${b.name}](${absoluteUrl(brandPath(b.slug))}): ${b._count.products} sản phẩm${b.country ? `, ${b.country}` : ""}`),
    "",
    "## Mua hàng & chính sách",
    "",
    `- [Liên hệ & yêu cầu báo giá](${absoluteUrl("/lien-he")})`,
    `- [Cửa hàng](${absoluteUrl("/cua-hang")})`,
    ...Object.entries(POLICIES).map(([slug, p]) => `- [${p.title}](${absoluteUrl(`/${slug}`)})`),
    "",
    "## Optional",
    "",
    `- [Toàn bộ danh sách sản phẩm (tên, hãng, mã, giá, link)](${absoluteUrl("/llms-full.txt")})`,
    `- [Kiến thức & hướng dẫn chọn dụng cụ](${absoluteUrl("/kien-thuc")})`,
    `- [Sitemap](${absoluteUrl("/sitemap.xml")})`,
    "",
  ];

  return new Response(lines.filter((l) => l !== null).join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
