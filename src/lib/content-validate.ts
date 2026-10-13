/**
 * Kiểm tra bản nháp nội dung sản phẩm do AI viết (scripts/content/rewrite.ts) trước khi người duyệt xem.
 * Không chặn lưu — trả về danh sách vấn đề để hiển thị ở trang duyệt.
 */

export type ProductDraft = {
  seoTitle: string;
  seoDesc: string;
  shortDesc: string;
  descriptionHtml: string;
  specs: { label: string; value: string }[];
  faq: { question: string; answer: string }[];
  imageAlt: string;
  needsData: string[];
};

export type DraftIssue = { level: "error" | "warning"; code: string; message: string };

const ALLOWED_TAGS = new Set(["h2", "h3", "p", "ul", "ol", "li", "strong", "em", "table", "thead", "tbody", "tr", "th", "td", "br"]);
const BANNED = ["tốt nhất", "hàng đầu thế giới", "giá rẻ nhất", "vĩnh viễn", "100% không", "siêu bền", "đỉnh cao"];
// "số 1" chỉ cấm khi là lời quảng cáo — "đầu vít số 1", "1/2 inch" là hợp lệ
const BANNED_PATTERNS: RegExp[] = [
  /(là|hàng|đứng|thương hiệu|nhà phân phối|đơn vị)\s+số\s+(1|một)\b(?!\s*\/)/i,
  /số\s+(1|một)\s+(thị trường|việt nam|thế giới|trong ngành)/i,
];
const bannedIn = (text: string) => [
  ...BANNED.filter((phrase) => text.includes(phrase)),
  ...BANNED_PATTERNS.flatMap((re) => text.match(re)?.[0] ?? []),
];
const REQUIRED_H2 = ["tổng quan", "đặc điểm nổi bật", "mua"];

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

/** Số trong văn bản, chuẩn hóa (1.290 / 1,290 → 1290; 0,5 → 0.5). */
function numbersIn(text: string): Set<string> {
  const out = new Set<string>();
  for (const raw of text.match(/\d+(?:[.,]\d+)*/g) ?? []) {
    const n = /^\d{1,3}([.,]\d{3})+$/.test(raw) ? raw.replace(/[.,]/g, "") : raw.replace(",", ".");
    out.add(String(Number(n)));
  }
  return out;
}

/** Tỉ lệ cụm 8 từ của `text` xuất hiện nguyên văn trong `source` (đo mức chép lại). */
export function copiedRatio(text: string, source: string): number {
  const words = (s: string) => s.toLowerCase().normalize("NFC").split(/\s+/).filter(Boolean);
  const a = words(text);
  const b = words(source);
  if (a.length < 8 || b.length < 8) return 0;
  const sourceShingles = new Set<string>();
  for (let i = 0; i + 8 <= b.length; i++) sourceShingles.add(b.slice(i, i + 8).join(" "));
  let total = 0;
  let hit = 0;
  for (let i = 0; i + 8 <= a.length; i++) {
    total++;
    if (sourceShingles.has(a.slice(i, i + 8).join(" "))) hit++;
  }
  return total ? hit / total : 0;
}

/**
 * @param draft bản nháp AI
 * @param sourceText toàn bộ dữ kiện đầu vào (tên + thông số + mô tả cũ) — dùng kiểm tra số liệu bịa
 * @param oldDescription mô tả cũ (văn bản thuần) — dùng đo mức chép lại
 */
export function validateDraft(draft: ProductDraft, sourceText: string, oldDescription: string): DraftIssue[] {
  const issues: DraftIssue[] = [];
  const add = (level: DraftIssue["level"], code: string, message: string) => issues.push({ level, code, message });

  if (draft.seoTitle.length > 65) add("warning", "seo_title_long", `Tiêu đề SEO ${draft.seoTitle.length} ký tự (nên ≤ 60).`);
  if (draft.seoDesc.length < 110 || draft.seoDesc.length > 165) add("warning", "seo_desc_length", `Mô tả SEO ${draft.seoDesc.length} ký tự (nên 130–155).`);
  if (draft.shortDesc.length > 320) add("warning", "short_desc_long", "Mô tả ngắn quá dài.");
  if (draft.faq.length < 3) add("warning", "faq_few", `Chỉ có ${draft.faq.length} câu hỏi FAQ.`);

  const tags = [...draft.descriptionHtml.matchAll(/<\/?([a-z0-9]+)[^>]*>/gi)].map((m) => m[1].toLowerCase());
  const badTags = [...new Set(tags.filter((t) => !ALLOWED_TAGS.has(t)))];
  if (badTags.length) add("error", "html_tags", `Thẻ HTML không cho phép: ${badTags.join(", ")}.`);
  if (/\s(class|style|on\w+)=/i.test(draft.descriptionHtml)) add("error", "html_attrs", "HTML có thuộc tính class/style/sự kiện.");

  const h2s = [...draft.descriptionHtml.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => stripHtml(m[1]).toLowerCase());
  for (const required of REQUIRED_H2) {
    if (!h2s.some((h) => h.includes(required))) add("warning", "missing_section", `Thiếu mục "${required}".`);
  }

  const allText = [draft.seoTitle, draft.seoDesc, draft.shortDesc, stripHtml(draft.descriptionHtml), ...draft.faq.flatMap((f) => [f.question, f.answer]), ...draft.specs.map((s) => s.value)].join(" ");
  const lower = allText.toLowerCase();
  const banned = bannedIn(lower);
  if (banned.length) add("error", "banned_phrase", `Có cụm từ cấm: ${banned.join(", ")}.`);

  // Số liệu không có trong dữ kiện = nghi bịa (bỏ qua số nhỏ ≤ 10 dùng để đếm, và các số chính sách cố định)
  const sourceNumbers = numbersIn(sourceText);
  const allowed = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "24", "100"]);
  const invented = [...numbersIn(allText)].filter((n) => !sourceNumbers.has(n) && !allowed.has(n));
  if (invented.length) add("error", "numbers_not_in_source", `Số liệu không có trong dữ kiện gốc: ${invented.slice(0, 10).join(", ")}.`);

  const copied = copiedRatio(stripHtml(draft.descriptionHtml), oldDescription);
  if (copied > 0.25) add("warning", "copied_old", `${Math.round(copied * 100)}% câu chữ trùng mô tả cũ (nên viết lại).`);

  if (draft.needsData.length) add("warning", "needs_data", `Thiếu dữ liệu: ${draft.needsData.join(", ")}.`);
  return issues;
}

export const stripHtmlText = stripHtml;

/**
 * Kiểm tra nội dung hub (danh mục, thương hiệu, bài kiến thức): thẻ HTML cho phép (kể cả <a> nội bộ),
 * từ cấm, độ dài SEO, link nội bộ có tồn tại không (truyền `knownPaths`).
 */
export function validateHubContent(
  item: { seoTitle?: string | null; seoDesc?: string | null; html?: string | null; texts?: (string | null | undefined)[] },
  options: { titleMax?: number; knownPaths?: Set<string> } = {},
): DraftIssue[] {
  const issues: DraftIssue[] = [];
  const add = (level: DraftIssue["level"], code: string, message: string) => issues.push({ level, code, message });
  const titleMax = options.titleMax ?? 45;
  const html = item.html ?? "";

  if (item.seoTitle && item.seoTitle.length > titleMax) add("warning", "seo_title_long", `Tiêu đề SEO ${item.seoTitle.length} ký tự (nên ≤ ${titleMax}).`);
  if (item.seoDesc && (item.seoDesc.length < 110 || item.seoDesc.length > 165)) add("warning", "seo_desc_length", `Mô tả SEO ${item.seoDesc.length} ký tự (nên 130–155).`);

  const tags = [...html.matchAll(/<\/?([a-z0-9]+)[^>]*>/gi)].map((m) => m[1].toLowerCase());
  const badTags = [...new Set(tags.filter((t) => t !== "a" && !ALLOWED_TAGS.has(t)))];
  if (badTags.length) add("error", "html_tags", `Thẻ HTML không cho phép: ${badTags.join(", ")}.`);
  if (/\s(class|style|id|on\w+)=/i.test(html)) add("error", "html_attrs", "HTML có thuộc tính class/style/id/sự kiện.");

  for (const m of html.matchAll(/<a\b([^>]*)>/gi)) {
    const href = m[1].match(/href="([^"]*)"/)?.[1];
    if (!href || !href.startsWith("/")) add("error", "external_link", `Link không phải nội bộ: ${href ?? "(trống)"}.`);
    else if (options.knownPaths && !options.knownPaths.has(href.split(/[?#]/)[0])) add("error", "broken_link", `Link nội bộ không tồn tại: ${href}.`);
  }

  const lower = [stripHtml(html), item.seoTitle, item.seoDesc, ...(item.texts ?? [])].filter(Boolean).join(" ").toLowerCase();
  const banned = bannedIn(lower);
  if (banned.length) add("error", "banned_phrase", `Có cụm từ cấm: ${banned.join(", ")}.`);
  return issues;
}
