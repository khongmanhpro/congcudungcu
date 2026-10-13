/**
 * Thương hiệu nhận diện từ tên sản phẩm.
 * `aliases`: regex trên tên đã bỏ dấu + chữ thường (normalizeName). Gồm cả lỗi chính tả đã gặp.
 * `country`: chỉ điền khi chắc chắn (xuất xứ thương hiệu); không rõ thì để trống.
 */
export type BrandDef = { name: string; slug: string; aliases: RegExp; country?: string };

export const BRANDS: BrandDef[] = [
  { name: "WOKIN", slug: "wokin", aliases: /\bwokin\b/ },
  { name: "TOPTUL", slug: "toptul", aliases: /\btoptul\b/, country: "Đài Loan" },
  { name: "KNIPEX", slug: "knipex", aliases: /\b(knipex|kniex|knipx)\b/, country: "Đức" },
  { name: "BOSCH", slug: "bosch", aliases: /\bbosch\b/, country: "Đức" },
  { name: "MATADOR", slug: "matador", aliases: /\bmatador\b/, country: "Đức" },
  { name: "STANLEY", slug: "stanley", aliases: /\bstanley\b/, country: "Mỹ" },
  { name: "MAKITA", slug: "makita", aliases: /\bmakita\b/, country: "Nhật Bản" },
  { name: "KING TONY", slug: "king-tony", aliases: /\bking ?tony\b/, country: "Đài Loan" },
  { name: "WORKPRO", slug: "workpro", aliases: /\b(workpro|workrpo|wokrpro)\b/ },
  { name: "ASAKI", slug: "asaki", aliases: /\basaki\b|\bak \d{3,4}\b/ },
  { name: "YUMITA", slug: "yumita", aliases: /\byumita\b/ },
  { name: "TOLSEN", slug: "tolsen", aliases: /\btolsen\b/ },
  { name: "TOTAL", slug: "total", aliases: /\btotal\b/ },
  { name: "SATA", slug: "sata", aliases: /\bsata\b/ },
  { name: "CSPS", slug: "csps", aliases: /\bcsps\b/ },
  { name: "EVERBRITE", slug: "everbrite", aliases: /\beverbrite\b/ },
  { name: "KONSUN", slug: "konsun", aliases: /\bkonsun\b/ },
  { name: "MITOOLS", slug: "mitools", aliases: /\bmitools\b/ },
  { name: "AUTOWORK", slug: "autowork", aliases: /\bauto ?work\b/ },
  { name: "LGWELDER", slug: "lgwelder", aliases: /\blg ?welder\b/ },
  { name: "KYORITSU", slug: "kyoritsu", aliases: /\bkyoritsu\b/, country: "Nhật Bản" },
  { name: "FLUKE", slug: "fluke", aliases: /\bfluke\b/, country: "Mỹ" },
  { name: "MITUTOYO", slug: "mitutoyo", aliases: /\bmitutoyo\b/, country: "Nhật Bản" },
  { name: "AUTEL", slug: "autel", aliases: /\bautel\b/ },
  { name: "JTC", slug: "jtc", aliases: /\bjtc\b/, country: "Đài Loan" },
  { name: "INGCO", slug: "ingco", aliases: /\bingco\b/ },
  { name: "DEWALT", slug: "dewalt", aliases: /\bdewalt\b/, country: "Mỹ" },
  { name: "MILWAUKEE", slug: "milwaukee", aliases: /\bmilwaukee\b/, country: "Mỹ" },
  { name: "HIKOKI", slug: "hikoki", aliases: /\b(hikoki|hitachi)\b/, country: "Nhật Bản" },
  { name: "ACCUD", slug: "accud", aliases: /\baccud\b/ },
  { name: "ELORA", slug: "elora", aliases: /\belora\b/, country: "Đức" },
  { name: "FELCO", slug: "felco", aliases: /\bfelco\b/, country: "Thụy Sĩ" },
  { name: "KIRSCHEN", slug: "kirschen", aliases: /\bkirschen\b/, country: "Đức" },
  { name: "STABILA", slug: "stabila", aliases: /\bstabila\b/, country: "Đức" },
  { name: "WERA", slug: "wera", aliases: /\bwera\b/, country: "Đức" },
  { name: "WIHA", slug: "wiha", aliases: /\bwiha\b/, country: "Đức" },
];

/** Mã Matador có dạng "0584 0410" (4 số + khoảng trắng + 4 số) khi tên không ghi hãng. */
const MATADOR_CODE = /\b0\d{3} \d{4}\b/;

export function detectBrand(normalizedName: string): BrandDef | null {
  for (const brand of BRANDS) if (brand.aliases.test(normalizedName)) return brand;
  if (MATADOR_CODE.test(normalizedName)) return BRANDS.find((b) => b.slug === "matador")!;
  return null;
}

/**
 * Tách mã model từ tên GỐC (còn hoa/thường, dấu cách). Ưu tiên:
 *  - Knipex/Matador: "20 02 140", "0584 0410"
 *  - mã chữ+số: "AAEB1010", "GSB 13 RE", "YMS-005", "WM-430"
 *  - dãy số 5–6 chữ số (WOKIN 738012)
 */
export function extractModel(name: string): string | null {
  const patterns = [
    /\b(\d{2} \d{2} \d{3})\b/, // Knipex 20 02 140
    /\b(0\d{3} \d{4})\b/, // Matador 0584 0410
    /\b((?:GSB|GSR|GBH|GWS|GKS|GST|GDR|GDX|GDS|GLM|GLL|GML|GHO|GOP|GKF|GCM|GTS)\s?\d{1,3}V?(?:[- ]\d{1,4})?(?:\s?[A-Z]{1,3})?)\b/, // Bosch
    /\b([A-Z]{1,5}-?\d{2,6}[A-Z]{0,3})\b/, // AAEB1010, YMS-005, JFDD0105, AK-3746
    /\b(\d{5,10})\b/, // WOKIN 738012, Bosch 2607002793, Mitools 1010001
  ];
  for (const re of patterns) {
    const match = name.match(re);
    if (match) return match[1].replace(/\s+/g, " ").trim();
  }
  return null;
}
