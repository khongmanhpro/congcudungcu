/**
 * Cây danh mục sản phẩm chuẩn SEO + luật phân loại theo tên sản phẩm.
 *
 * - URL: danh mục cha ở gốc (/kim), danh mục con lồng 1 cấp (/kim/kim-cat).
 * - `match`: regex chạy trên tên ĐÃ BỎ DẤU, chữ thường (xem normalizeName). Luật được thử
 *   theo đúng THỨ TỰ trong RULES (cụ thể trước, chung sau) — luật đầu tiên khớp sẽ thắng.
 * - Sản phẩm không khớp luật nào → FALLBACK theo danh mục cũ → báo cáo để người duyệt.
 */

export type TaxonomyNode = {
  slug: string;
  name: string;
  /** Câu mô tả ngắn dùng làm intro mặc định cho trang danh mục */
  intro?: string;
  children?: TaxonomyNode[];
};

export const TAXONOMY: TaxonomyNode[] = [
  {
    slug: "kim",
    name: "Kìm",
    children: [
      { slug: "kim-cat", name: "Kìm cắt" },
      { slug: "kim-mui-nhon", name: "Kìm mũi nhọn" },
      { slug: "kim-dien-kim-tong-hop", name: "Kìm điện & kìm tổng hợp" },
      { slug: "kim-mo-phe", name: "Kìm mở phe" },
      { slug: "kim-bam-cos-tuot-day", name: "Kìm bấm cos & tuốt dây" },
      { slug: "kim-chet-kim-kep", name: "Kìm chết & kìm kẹp" },
      { slug: "kim-mo-qua-kim-nuoc", name: "Kìm mỏ quạ & kìm nước" },
      { slug: "kim-khac", name: "Bộ kìm & kìm chuyên dụng" },
    ],
  },
  {
    slug: "co-le-mo-let",
    name: "Cờ lê & mỏ lết",
    children: [
      { slug: "co-le-vong-mieng", name: "Cờ lê vòng miệng" },
      { slug: "co-le-hai-dau-vong", name: "Cờ lê hai đầu vòng" },
      { slug: "co-le-hai-dau-mieng", name: "Cờ lê hai đầu miệng" },
      { slug: "co-le-tu-dong", name: "Cờ lê tự động (cờ lê lắc)" },
      { slug: "co-le-dac-biet", name: "Cờ lê đóng, cờ lê xích & cờ lê đặc biệt" },
      { slug: "bo-co-le", name: "Bộ cờ lê" },
      { slug: "mo-let", name: "Mỏ lết" },
    ],
  },
  {
    slug: "tua-vit-luc-giac",
    name: "Tua vít & lục giác",
    children: [
      { slug: "tua-vit", name: "Tua vít" },
      { slug: "bo-tua-vit", name: "Bộ tua vít" },
      { slug: "dau-vit-mui-vit", name: "Đầu vít & mũi vít" },
      { slug: "luc-giac-hoa-thi", name: "Lục giác & hoa thị" },
    ],
  },
  {
    slug: "tuyp-can-siet",
    name: "Tuýp & cần siết",
    children: [
      { slug: "dau-tuyp", name: "Đầu tuýp" },
      { slug: "bo-tuyp", name: "Bộ tuýp" },
      { slug: "can-siet-phu-kien", name: "Cần siết & phụ kiện tuýp" },
      { slug: "can-luc", name: "Cần lực (cờ lê lực)" },
    ],
  },
  {
    slug: "dung-cu-cam-tay",
    name: "Dụng cụ cầm tay",
    children: [
      { slug: "bua", name: "Búa" },
      { slug: "dao-keo", name: "Dao, kéo & cưa tay" },
      { slug: "duc-giua-dot-lo", name: "Đục, giũa & đột lỗ" },
      { slug: "cao-thao", name: "Cảo tháo" },
      { slug: "taro-ban-ren", name: "Taro & bàn ren" },
      { slug: "dung-cu-cam-tay-khac", name: "Dụng cụ cầm tay khác" },
    ],
  },
  {
    slug: "bo-dung-cu-tu-do-nghe",
    name: "Bộ dụng cụ & tủ đồ nghề",
    children: [
      { slug: "bo-dung-cu", name: "Bộ dụng cụ tổng hợp" },
      { slug: "tu-hop-do-nghe", name: "Tủ, xe đẩy & hộp đồ nghề" },
    ],
  },
  {
    slug: "may-khoan-van-vit",
    name: "Máy khoan & máy vặn vít",
    children: [
      { slug: "may-khoan", name: "Máy khoan" },
      { slug: "may-van-vit-siet-bu-long", name: "Máy vặn vít & siết bu lông" },
      { slug: "mui-khoan-phu-kien", name: "Mũi khoan & phụ kiện khoan" },
    ],
  },
  {
    slug: "may-mai-may-cat",
    name: "Máy mài & máy cắt",
    children: [
      { slug: "may-mai", name: "Máy mài" },
      { slug: "may-cat-may-cua", name: "Máy cắt & máy cưa" },
      { slug: "may-cha-nham-danh-bong", name: "Máy chà nhám & đánh bóng" },
      { slug: "phu-kien-cat-mai", name: "Đá cắt, lưỡi cưa & phụ kiện mài" },
    ],
  },
  { slug: "dung-cu-dien", name: "Dụng cụ điện khác" },
  { slug: "dung-cu-khi-nen", name: "Dụng cụ khí nén" },
  { slug: "may-han", name: "Máy hàn & phụ kiện hàn" },
  {
    slug: "thiet-bi-do-luong",
    name: "Thiết bị đo lường",
    children: [
      { slug: "thuoc-cuon", name: "Thước cuộn & thước dây" },
      { slug: "thuoc-cap-panme", name: "Thước cặp & panme" },
      { slug: "thuoc-thuy-may-laser", name: "Thước thủy & máy cân bằng laser" },
      { slug: "thuoc-ke-can-la", name: "Thước ke, thước lá & căn lá" },
      { slug: "may-do-dong-ho-do", name: "Máy đo & đồng hồ đo" },
    ],
  },
  {
    slug: "thiet-bi-garage-nang-ha",
    name: "Thiết bị garage & nâng hạ",
    children: [
      { slug: "dung-cu-sua-chua-o-to", name: "Dụng cụ sửa chữa ô tô" },
      { slug: "thiet-bi-nang-ha", name: "Pa lăng, kích & thiết bị nâng hạ" },
    ],
  },
  {
    slug: "thiet-bi-nha-xuong",
    name: "Thiết bị nhà xưởng",
    children: [
      { slug: "e-to-kep", name: "Ê tô & kẹp" },
      { slug: "thang-nhom", name: "Thang nhôm" },
      { slug: "thiet-bi-nha-xuong-khac", name: "Thiết bị nhà xưởng khác" },
    ],
  },
  {
    slug: "thiet-bi-dien-chieu-sang",
    name: "Thiết bị điện & chiếu sáng",
    children: [
      { slug: "den-chieu-sang", name: "Đèn pin & đèn làm việc" },
      { slug: "thiet-bi-dien-khac", name: "Pin, sạc & thiết bị điện khác" },
    ],
  },
  { slug: "bao-ho-lao-dong", name: "Bảo hộ lao động" },
  { slug: "dung-cu-dung-xang", name: "Dụng cụ dùng xăng" },
];

/** Luật phân loại: [slug danh mục lá, regex trên tên đã bỏ dấu]. Thứ tự = độ ưu tiên. */
export const RULES: [string, RegExp][] = [
  // --- máy & thiết bị (chứa từ "may" nên xét trước dụng cụ cầm tay) ---
  ["may-han", /\b(may han|mo han|kim han|que han|bo han|day han|mat na han|welder|\bmig\b|\bmma\b|plasma|\btig\b)/],
  ["dung-cu-khi-nen", /(khi nen|may nen|sung phun|sung xit|day hoi|ong hoi|dau noi nhanh|\bair\b|sung bom hoi|binh phun)/],
  ["dung-cu-dung-xang", /(may phat|dung xang|chay xang|may cat co|may cua xich|may bom)/],
  ["mui-khoan-phu-kien", /(mui khoan|bo mui|mui khoet|mui taro|dau kep mui|mui duc|mui sds|dau khoan|tay khoan)/],
  ["may-khoan", /(may khoan|khoan pin|khoan be tong|khoan dong luc|khoan bua|\bgsb\b|\bgbh\b|\bgsr\b)/],
  ["may-van-vit-siet-bu-long", /(may van vit|may bat vit|may siet|sung (ban|siet|xiet) ?bu ?long|may van oc|sung van vit)/],
  ["dao-keo", /(cua (cam tay|sat|khung|go|tay|xep|ga|nhat|mini|cat canh)|khung cua|luoi cua (sat|tay|khung))/],
  ["phu-kien-cat-mai", /(\bda (chuyen )?(cat|mai)|luoi cua|luoi cat|dia mai|dia cat|banh nham|giay nham|nham xep|chan nham|ban chai cuoc)/],
  ["may-cha-nham-danh-bong", /(may cha|may danh bong|may nham)/],
  ["may-mai", /(may mai|\bgws\b)/],
  ["may-cat-may-cua", /(may cat|may cua|may bao|may phay|may ct)/],
  ["dung-cu-dien", /(quat hut|may lam sach|robot|may thoi|may hut|sung ban keo|sung nhiet|sung khong khi nong|may rua|may xit|may tron|may duc|may dong dinh|radio|may cha)/],

  // --- đo lường ---
  ["can-luc", /(co le luc|can luc|can xiet luc|can siet luc|torque|tuyp luc)/],
  ["thuoc-cuon", /(thuoc (day|cuon))/],
  ["thuoc-cap-panme", /(thuoc (cap|kep)|panme|dong ho so|du xich|caliper)/],
  ["thuoc-thuy-may-laser", /(thuoc thuy|ni ?vo|livo|laser|can bang)/],
  ["thuoc-ke-can-la", /(thuoc ke|thuoc la|thuoc goc|\be ?ke\b|can la|feeler|thuoc do goc|thuoc thang)/],
  ["may-do-dong-ho-do", /(may do|dong ho (van nang|do|ap)|ampe|kim ke|but thu|nhiet ke|do am|kyoritsu|fluke|\bdo (dien|nhiet|khoang cach|do day))/],

  // --- garage, nâng hạ, nhà xưởng ---
  ["thiet-bi-nang-ha", /(pa ?lang|\bkich\b|cau nang|ban nang|cau moc|me ke|chan ke|xe nang|con doi|tay kich)/],
  ["dung-cu-sua-chua-o-to", /(xec mang|dong co|piston|ve xe|bugi|phanh|bmw|toyota|mercedes|hyundai|bom dau|loc dau|thay dau|hung dau|xe chui gam|hop so|bom mo|autel|chan doan|dong ho ap suat lop|thao lop|o to|xe may|lam dong|bo kiem tra)/],
  ["tu-hop-do-nghe", /(tu dung cu|tu do nghe|tu dung do|xe day|hop dung|thung dung|tui dung|balo|ke dung|khay dung|tu (\d+) ngan|\bke \d+ tang|ke (sat|nhua|de|treo)|thung nhua|tu nhua|moc treo|bang treo|ke luoi|vach luoi|tui (cong cu|do nghe|dung cu))/],
  ["e-to-kep", /(\be ?to\b|eto|kep sat|kep go|kep nhanh|kep chu|kep f\b|kep c\b|kep goc|kep ong)/],
  ["thang-nhom", /\bthang\b/],

  // --- điện & chiếu sáng, bảo hộ ---
  ["den-chieu-sang", /(\bden\b)/],
  ["thiet-bi-dien-khac", /(\bpin\b.*(sac|li-?ion|\dah|\d+v)|bo sac|cuc sac|sac pin|^pin )/],
  ["bao-ho-lao-dong", /(gang tay|mat na|ao phan quang|giay bao ho|mu bao ho|non bao ho|kinh (bao ho|trong|ram)|nut tai|chup tai|day an toan|khau trang|ung bao ho|tap de)/],

  // --- tuýp & cần siết ---
  ["bo-tuyp", /(bo (dau )?tuyp|bo khau|bo dau khau|bo socket)/],
  ["can-siet-phu-kien", /(can (siet|xiet|lac|tu dong|chu t|noi|vat)|thanh noi|tay noi|khop noi|dau chuyen|cao chuyen|ratchet handle|can tuyp)/],
  // "điếu" (tuýp chữ L…) — KHÔNG khớp "điều chỉnh"
  ["dau-tuyp", /(^dieu\b(?! chinh)|\bdieu (chu|l)\b|dau tuyp|\btuyp\b|dau khau|socket)/],

  // --- kìm ---
  ["kim-mo-phe", /(kim (mo |bam )?phe|\bphe (trong|ngoai)\b)/],
  ["kim-bam-cos-tuot-day", /(tuoc day|bam cos|kim (bam|bop|ep)( dau)? ?cos|kim tuot|tuot day|kim cat tuot|kim bam (day|dau)|kim bam cot)/],
  ["kim-chet-kim-kep", /(kim (chet|bam chet|kep|giu)|kim kep|kim bam chet)/],
  ["kim-mo-qua-kim-nuoc", /(mo qua|kim (nuoc|ong|ong nuoc|so|mo lech))/],
  ["kim-mui-nhon", /(kim (mui|mo) ?(nhon|dai|cong|det|tron|bang)|kim mui)/],
  ["kim-cat", /(kim cat|kim cong luc|kim (bam )?cat)/],
  ["kim-dien-kim-tong-hop", /(kim (dien|tong hop|da nang|rang|cach dien|vde|co khi|dau bang|bam))/],
  // chỉ khi tên bắt đầu bằng "kìm"/"bộ kìm" — tránh nhầm "kim loại"
  ["kim-khac", /^(bo (\d+ (cai |chi tiet )?)?)?kim\b(?! loai)/],

  // --- cờ lê, mỏ lết ---
  ["bo-co-le", /\bbo co le\b/],
  ["co-le-tu-dong", /(co le (tu dong|lac|bang coc|ratchet|vong mieng tu dong|mieng tu dong)|ratchet (spanner|wrench))/],
  ["co-le-hai-dau-vong", /(co le (2|hai) dau vong|co le vong (2|hai) dau|co le vong lech|co le vong \d)/],
  ["mo-let", /(^mo let|^bo mo let|co le mo let|\bmo let (rang|ong|cang|xich))/],
  ["co-le-dac-biet", /(co le (vong keo|mo puli|dong|xich|day xich|ong|tuyp|dai xich|moc|chu|bien|mo nap|dau mo dong|mo thung|cong|dau gap)|slogging|co le dong)/],
  ["co-le-hai-dau-mieng", /(co le (2|hai) dau (mieng|mo)|co le dau mo|co le mieng|co le det|co le (1|mot) dau mieng|open end)/],
  ["co-le-vong-mieng", /(co le vong mieng|co le ket hop|combination|^co le\b|^bo co le|spanner)/],
  ["mo-let", /(mo let|mo-let|wrench)/],

  // --- tua vít, lục giác ---
  ["bo-tua-vit", /(bo (tua vit|tuoc no vit|vit|to vit))/],
  ["dau-vit-mui-vit", /(dau vit|mui vit|dau bit|bit vit|\bbit\b)/],
  ["luc-giac-hoa-thi", /(luc giac|hoa thi|torx|chia (khoa )?sao|chia luc giac)/],
  ["tua-vit", /(tua vit|tuoc no vit|to vit|\bvit (dep|bake|dong|cach dien))/],

  // --- dụng cụ cầm tay khác ---
  ["bua", /\bbua\b/],
  ["dao-keo", /(\bdao\b|\bkeo\b|luoi dao)/],
  ["duc-giua-dot-lo", /(\bduc\b|giua|\bdua\b|dot lo|dung cu dot|dau dot)/],
  ["cao-thao", /(\bcao\b|\bvam\b)/],
  ["taro-ban-ren", /(taro|ban ren|\bren\b)/],
  ["bo-dung-cu", /(bo dung cu|bo do nghe|bo sua chua|tool set|bo \d+ (chi tiet|mon|cai|pcs))/],
];

/** Không khớp luật nào → danh mục lá mặc định theo danh mục cũ (slug cũ → slug mới). */
export const FALLBACK: Record<string, string> = {
  "cong-cu-dung-cu": "dung-cu-cam-tay-khac",
  "thiet-bi-dien": "thiet-bi-dien-khac",
  "may-khoan-may-van-vit": "may-khoan",
  "may-mai-may-cat": "may-cat-may-cua",
  "may-co-khi": "thiet-bi-nha-xuong-khac",
  "phu-tung-linh-kien": "can-siet-phu-kien",
  "thiet-bi-do-luong": "may-do-dong-ho-do",
  "may-han-phu-kien": "may-han",
  "dung-cu-dien": "dung-cu-dien",
  "dung-cu-khi-nen": "dung-cu-khi-nen",
  "do-bao-ho-lao-dong": "bao-ho-lao-dong",
  "dung-cu-dung-xang": "dung-cu-dung-xang",
};

/** Danh mục cũ → danh mục mới gần nhất, để tạo redirect 301 /danh-muc/<cũ> */
export const OLD_CATEGORY_REDIRECT: Record<string, string> = {
  "cong-cu-dung-cu": "dung-cu-cam-tay",
  "thiet-bi-dien": "thiet-bi-dien-chieu-sang",
  "may-khoan-may-van-vit": "may-khoan-van-vit",
  "may-mai-may-cat": "may-mai-may-cat",
  "may-co-khi": "thiet-bi-nha-xuong",
  "phu-tung-linh-kien": "tuyp-can-siet",
  "thiet-bi-do-luong": "thiet-bi-do-luong",
  "may-han-phu-kien": "may-han",
  "dung-cu-dien": "dung-cu-dien",
  "dung-cu-khi-nen": "dung-cu-khi-nen",
  "do-bao-ho-lao-dong": "bao-ho-lao-dong",
  "dung-cu-dung-xang": "dung-cu-dung-xang",
};

/** Bỏ dấu tiếng Việt, chữ thường, chỉ giữ chữ-số-khoảng trắng. */
export function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function classifyName(name: string): string | null {
  // "kềm" là cách viết khác của "kìm" (chỉ khi theo sau là loại kìm, tránh "kèm theo")
  const normalized = normalizeName(name).replace(/\bkem (?=(tong hop|cat|mo|mui|bam|dien|tuot|nhon|cong|rang|ra))/g, "kim ");
  for (const [slug, re] of RULES) if (re.test(normalized)) return slug;
  return null;
}

/** Danh sách phẳng (cha + con) kèm slug cha và thứ tự. */
export function flattenTaxonomy() {
  const out: { slug: string; name: string; parent: string | null; position: number; leaf: boolean }[] = [];
  TAXONOMY.forEach((node, i) => {
    out.push({ slug: node.slug, name: node.name, parent: null, position: i, leaf: !node.children?.length });
    node.children?.forEach((child, j) => out.push({ slug: child.slug, name: child.name, parent: node.slug, position: j, leaf: true }));
  });
  return out;
}
