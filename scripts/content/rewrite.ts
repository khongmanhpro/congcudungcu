/**
 * Viết lại nội dung sản phẩm bằng Claude (Message Batches API, giảm 50% chi phí) → lưu BẢN NHÁP (Product.aiDraft)
 * chờ người duyệt ở /admin/content-review. Không ghi đè nội dung đang hiển thị.
 *
 *   pnpm exec tsx scripts/content/rewrite.ts facts --limit 10             # (gói Max) xuất dữ kiện cho Claude Code viết
 *   pnpm exec tsx scripts/content/rewrite.ts import tmp/content-drafts/drafts-x.json  # (gói Max) nạp bản nháp
 *   pnpm exec tsx scripts/content/rewrite.ts facts --all --batch 80      # xuất toàn bộ thành nhiều lô (gom theo danh mục)
 *   pnpm exec tsx scripts/content/rewrite.ts check <drafts.json>         # kiểm tra file nháp, không ghi DB
 *   pnpm exec tsx scripts/content/rewrite.ts publish <drafts.json>       # đăng thẳng nháp không lỗi (AI_PUBLISHED, chưa duyệt)
 *   pnpm exec tsx scripts/content/rewrite.ts preview --limit 50           # xem dữ kiện sẽ gửi (không gọi API)
 *   pnpm exec tsx scripts/content/rewrite.ts estimate --limit 50          # đếm token đầu vào (miễn phí), chưa chi tiền
 *   pnpm exec tsx scripts/content/rewrite.ts submit --limit 50            # pilot 50 sp (ưu tiên sp có giá, xen kẽ hãng)
 *   pnpm exec tsx scripts/content/rewrite.ts submit --brand knipex        # theo hãng
 *   pnpm exec tsx scripts/content/rewrite.ts status <batchId>
 *   pnpm exec tsx scripts/content/rewrite.ts collect <batchId>            # chờ xong → kiểm tra → lưu nháp + in chi phí thực
 *
 * Cần ANTHROPIC_API_KEY (hoặc profile `ant auth login`). Prompt: content/prompts/product-rewrite.md
 */
import "dotenv/config";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import { type ProductDraft, stripHtmlText, validateDraft } from "../../src/lib/content-validate";
import { pingIndexNow } from "../../src/lib/indexnow";
import { productPath } from "../../src/lib/urls";
import { readSpecs } from "../../src/lib/specs";

const MODEL = "claude-opus-5-5";
// Giá Claude Opus 5.5 (USD / 1 triệu token) — Batch API tính 50%. Chỉ để ước tính; hóa đơn thật xem ở Console.
const PRICE = { input: 4, output: 20, cacheWrite: 5, cacheRead: 0.2, batchDiscount: 0.5 };
const STATE_DIR = "tmp/content-batches";

const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL!) });
const SYSTEM_PROMPT = readFileSync("content/prompts/product-rewrite.md", "utf8");

/** Schema JSON cho output_config.format (mọi object: additionalProperties false, liệt kê đủ required). */
const DRAFT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["seoTitle", "seoDesc", "shortDesc", "descriptionHtml", "specs", "faq", "imageAlt", "needsData"],
  properties: {
    seoTitle: { type: "string" },
    seoDesc: { type: "string" },
    shortDesc: { type: "string" },
    descriptionHtml: { type: "string" },
    specs: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["label", "value"], properties: { label: { type: "string" }, value: { type: "string" } } },
    },
    faq: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["question", "answer"], properties: { question: { type: "string" }, answer: { type: "string" } } },
    },
    imageAlt: { type: "string" },
    needsData: { type: "array", items: { type: "string" } },
  },
} as const;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}

type SourceProduct = Awaited<ReturnType<typeof loadProducts>>[number];

const PRODUCT_SELECT = {
  id: true, name: true, sku: true, model: true, origin: true, price: true, shortDesc: true, description: true, specs: true,
  brand: { select: { name: true, slug: true, country: true } },
  category: { select: { name: true, parent: { select: { name: true } } } },
} as const;

async function loadProducts(where: Record<string, unknown>) {
  return prisma.product.findMany({
    where: { status: "PUBLISHED", contentStatus: "ORIGINAL", aiDraft: { equals: Prisma.AnyNull }, ...where },
    select: PRODUCT_SELECT,
  });
}

/** Chọn sản phẩm: ưu tiên có giá, xen kẽ thương hiệu để mẫu pilot đa dạng. */
async function selectProducts(): Promise<SourceProduct[]> {
  const brand = arg("brand");
  const limit = Number(arg("limit") ?? "50");
  const rows = await loadProducts(brand ? { brand: { slug: brand } } : {});
  const byBrand = new Map<string, SourceProduct[]>();
  for (const p of rows.sort((a, b) => Number(b.price > 0) - Number(a.price > 0))) {
    const key = p.brand?.slug ?? "-";
    byBrand.set(key, [...(byBrand.get(key) ?? []), p]);
  }
  const queues = [...byBrand.values()];
  const picked: SourceProduct[] = [];
  while (picked.length < limit && queues.some((q) => q.length)) {
    for (const q of queues) if (q.length && picked.length < limit) picked.push(q.shift()!);
  }
  return picked;
}

function facts(p: SourceProduct) {
  const specs = readSpecs(p.specs);
  return {
    name: p.name,
    brand: p.brand?.name ?? null,
    brandCountry: p.brand?.country ?? null,
    model: p.model ?? p.sku ?? null,
    origin: p.origin ?? null,
    category: [p.category?.parent?.name, p.category?.name].filter(Boolean).join(" › ") || null,
    priceStatus: p.price > 0 ? "listed" : "contact",
    specs,
    shortDesc: p.shortDesc ? stripHtmlText(p.shortDesc) : null,
    oldDescription: stripHtmlText(p.description || "").slice(0, 8000),
  };
}

function requestParams(p: SourceProduct) {
  return {
    model: MODEL,
    max_tokens: 16000,
    // system prompt giống nhau cho mọi sản phẩm → cache
    system: [{ type: "text" as const, text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" as const } }],
    output_config: { effort: "medium" as const, format: { type: "json_schema" as const, schema: DRAFT_SCHEMA } },
    messages: [{ role: "user" as const, content: `<product>\n${JSON.stringify(facts(p), null, 1)}\n</product>` }],
  };
}

// tạo client khi cần (lệnh preview không cần API key)
let anthropic: Anthropic | null = null;
const getClient = () => (anthropic ??= new Anthropic());

/** Xem dữ kiện gửi cho AI (không gọi API, không tốn tiền). */
async function preview() {
  const products = await selectProducts();
  console.log(`${products.length} sản phẩm được chọn. Hãng: ${[...new Set(products.map((p) => p.brand?.name ?? "-"))].join(", ")}`);
  console.log(`Có giá: ${products.filter((p) => p.price > 0).length} · có mô tả cũ: ${products.filter((p) => p.description).length}`);
  if (products[0]) console.log("\nVí dụ dữ kiện sản phẩm đầu tiên:\n" + JSON.stringify(facts(products[0]), null, 2).slice(0, 1500));
}

async function estimate() {
  const products = await selectProducts();
  let input = 0;
  for (const p of products) {
    const r = await getClient().messages.countTokens({ model: MODEL, system: requestParams(p).system, messages: requestParams(p).messages });
    input += r.input_tokens;
  }
  console.log(`${products.length} sản phẩm · ${input.toLocaleString()} token đầu vào (TB ${Math.round(input / Math.max(1, products.length))}/sp).`);
  console.log("Token đầu ra (gồm suy nghĩ) chỉ biết sau khi chạy — hãy chạy pilot `submit --limit 50` rồi `collect` để có chi phí thật.");
}

async function submit() {
  const products = await selectProducts();
  if (products.length === 0) return console.log("Không còn sản phẩm nào cần viết lại.");
  const batch = await getClient().messages.batches.create({
    requests: products.map((p) => ({ custom_id: p.id, params: requestParams(p) })),
  });
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(`${STATE_DIR}/${batch.id}.json`, JSON.stringify({ batchId: batch.id, createdAt: new Date().toISOString(), productIds: products.map((p) => p.id) }, null, 2));
  console.log(`Đã tạo batch ${batch.id} với ${products.length} sản phẩm. Theo dõi: rewrite.ts status ${batch.id}`);
}

async function status(batchId: string) {
  const b = await getClient().messages.batches.retrieve(batchId);
  console.log(`${b.processing_status} · đang xử lý ${b.request_counts.processing} · xong ${b.request_counts.succeeded} · lỗi ${b.request_counts.errored} · hết hạn ${b.request_counts.expired}`);
}

/** Kiểm tra + lưu bản nháp vào Product.aiDraft (trạng thái AI_DRAFT, chờ duyệt). */
async function saveDraft(productId: string, draft: ProductDraft, source: Record<string, string>) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: PRODUCT_SELECT,
  });
  if (!product) return null;
  const f = facts(product);
  const issues = validateDraft(draft, JSON.stringify(f), f.oldDescription);
  await prisma.product.update({
    where: { id: product.id },
    data: { contentStatus: "AI_DRAFT", aiDraft: { draft, issues, ...source, createdAt: new Date().toISOString() } },
  });
  return { name: product.name, issues, errors: issues.filter((i) => i.level === "error").length };
}

/**
 * Viết bằng gói Claude Max (Claude Code), không qua API:
 *   facts --limit 10 → xuất dữ kiện ra tmp/content-drafts/facts-*.json để Claude Code đọc và viết
 *   import <file>     → nạp file [{ id, draft }] Claude Code viết, kiểm tra và lưu nháp
 */
async function exportFacts() {
  if (process.argv.includes("--all")) {
    // toàn bộ sp chưa viết, gom theo danh mục → các biến thể (tuýp 8mm, 9mm…) nằm cùng lô, viết nhất quán
    const size = Number(arg("batch") ?? "80");
    const rows = (await loadProducts({})).sort((a, b) => {
      const ka = `${a.category?.parent?.name ?? ""}|${a.category?.name ?? ""}|${a.name}`;
      const kb = `${b.category?.parent?.name ?? ""}|${b.category?.name ?? ""}|${b.name}`;
      return ka.localeCompare(kb, "vi");
    });
    mkdirSync("tmp/content-drafts/batches", { recursive: true });
    for (let i = 0; i * size < rows.length; i++) {
      const file = `tmp/content-drafts/batches/facts-${String(i + 1).padStart(2, "0")}.json`;
      writeFileSync(file, JSON.stringify(rows.slice(i * size, (i + 1) * size).map((p) => ({ id: p.id, facts: facts(p) })), null, 1));
    }
    return console.log(`Đã xuất ${rows.length} sản phẩm thành ${Math.ceil(rows.length / size)} lô → tmp/content-drafts/batches/`);
  }
  const products = await selectProducts();
  mkdirSync("tmp/content-drafts", { recursive: true });
  const file = `tmp/content-drafts/facts-${Date.now()}.json`;
  writeFileSync(file, JSON.stringify(products.map((p) => ({ id: p.id, facts: facts(p) })), null, 1));
  console.log(`Đã xuất dữ kiện ${products.length} sản phẩm → ${file}`);
}

async function importDrafts(file: string) {
  const rows = JSON.parse(readFileSync(file, "utf8")) as { id: string; draft: ProductDraft }[];
  let saved = 0;
  for (const row of rows) {
    const result = await saveDraft(row.id, row.draft, { model: "claude-code (gói Max)", file });
    if (!result) {
      console.log(`  ? ${row.id}: không tìm thấy sản phẩm`);
      continue;
    }
    saved++;
    const flag = result.errors ? "✗" : result.issues.length ? "!" : "✓";
    console.log(`  ${flag} ${result.name.slice(0, 60)}${result.issues.length ? `\n      ${result.issues.map((i) => `[${i.level}] ${i.message}`).join("\n      ")}` : ""}`);
  }
  console.log(`\nĐã lưu ${saved}/${rows.length} bản nháp. Duyệt tại /admin/content-review`);
}

/** Kiểm tra file nháp (không ghi DB): số lỗi/cảnh báo theo loại. */
async function checkDrafts(file: string) {
  const rows = JSON.parse(readFileSync(file, "utf8")) as { id: string; draft: ProductDraft }[];
  const products = await prisma.product.findMany({ where: { id: { in: rows.map((r) => r.id) } }, select: PRODUCT_SELECT });
  const byId = new Map(products.map((p) => [p.id, p]));
  const codes = new Map<string, number>();
  let bad = 0;
  for (const row of rows) {
    const product = byId.get(row.id);
    if (!product) { console.log(`  ? ${row.id}: không tìm thấy sản phẩm`); bad++; continue; }
    const f = facts(product);
    const issues = validateDraft(row.draft, JSON.stringify(f), f.oldDescription);
    for (const i of issues) codes.set(`${i.level}:${i.code}`, (codes.get(`${i.level}:${i.code}`) ?? 0) + 1);
    const errors = issues.filter((i) => i.level === "error");
    if (errors.length) { bad++; console.log(`  ✗ ${product.name.slice(0, 60)}: ${errors.map((i) => i.message).join(" ")}`); }
  }
  console.log(`${rows.length} bản nháp · ${bad} có lỗi · ${[...codes].map(([k, n]) => `${k}=${n}`).join(", ")}`);
  if (bad) process.exitCode = 2;
}

/**
 * Đăng thẳng bản nháp lên site (không qua duyệt từng bài) — dùng khi chưa có dữ liệu gốc và cần trang có mô tả.
 * Chỉ đăng bản nháp không lỗi; trạng thái AI_PUBLISHED để biết là chưa có người duyệt (sửa tay trong admin bất cứ lúc nào).
 */
async function publishDrafts(file: string) {
  const rows = JSON.parse(readFileSync(file, "utf8")) as { id: string; draft: ProductDraft }[];
  let published = 0;
  const indexedPaths: string[] = [];
  for (const row of rows) {
    const product = await prisma.product.findUnique({
      where: { id: row.id },
      select: { ...PRODUCT_SELECT, slug: true, status: true, contentStatus: true, images: { orderBy: { position: "asc" }, take: 1, select: { id: true } } },
    });
    if (!product || product.contentStatus === "REVIEWED") continue; // không ghi đè nội dung người đã duyệt
    const f = facts(product);
    const issues = validateDraft(row.draft, JSON.stringify(f), f.oldDescription);
    if (issues.some((i) => i.level === "error")) { console.log(`  ✗ bỏ qua (có lỗi): ${product.name.slice(0, 60)}`); continue; }
    const d = row.draft;
    await prisma.$transaction([
      prisma.product.update({
        where: { id: product.id },
        data: {
          description: d.descriptionHtml, shortDesc: d.shortDesc, seoTitle: d.seoTitle, seoDesc: d.seoDesc, faq: d.faq,
          ...(d.specs.length ? { specs: d.specs } : {}),
          contentStatus: "AI_PUBLISHED", contentUpdatedAt: new Date(), aiDraft: Prisma.DbNull,
        },
      }),
      ...(product.images[0] && d.imageAlt ? [prisma.productImage.update({ where: { id: product.images[0].id }, data: { alt: d.imageAlt } })] : []),
    ]);
    published++;
    if (product.status === "PUBLISHED") indexedPaths.push(productPath(product.slug));
  }
  // báo Bing/Yandex ngay (một lần cho cả lô) — Bing là nguồn của ChatGPT Search, Copilot; không làm gì trên localhost (xem indexnow.ts)
  if (indexedPaths.length) pingIndexNow(indexedPaths);
  console.log(`Đã đăng ${published}/${rows.length} mô tả (${file}).`);
}

async function collect(batchId: string) {
  for (;;) {
    const b = await getClient().messages.batches.retrieve(batchId);
    if (b.processing_status === "ended") break;
    console.log(`Đang chờ… ${b.request_counts.processing} yêu cầu còn đang xử lý`);
    await new Promise((resolve) => setTimeout(resolve, 60_000));
  }

  const usage = { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 };
  let saved = 0;
  let withErrors = 0;
  const failed: string[] = [];

  for await (const item of await getClient().messages.batches.results(batchId)) {
    if (item.result.type !== "succeeded") {
      failed.push(`${item.custom_id}: ${item.result.type}`);
      continue;
    }
    const message = item.result.message;
    usage.input += message.usage.input_tokens;
    usage.output += message.usage.output_tokens;
    usage.cacheWrite += message.usage.cache_creation_input_tokens ?? 0;
    usage.cacheRead += message.usage.cache_read_input_tokens ?? 0;

    if (message.stop_reason === "refusal" || message.stop_reason === "max_tokens") {
      failed.push(`${item.custom_id}: stop_reason=${message.stop_reason}`);
      continue;
    }
    const text = message.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("");
    let draft: ProductDraft;
    try {
      draft = JSON.parse(text) as ProductDraft;
    } catch {
      failed.push(`${item.custom_id}: JSON không hợp lệ`);
      continue;
    }

    const result = await saveDraft(item.custom_id, draft, { model: MODEL, batchId });
    if (!result) continue;
    if (result.errors) withErrors++;
    saved++;
  }

  const cost =
    ((usage.input * PRICE.input + usage.output * PRICE.output + usage.cacheWrite * PRICE.cacheWrite + usage.cacheRead * PRICE.cacheRead) / 1e6) * PRICE.batchDiscount;
  console.log(`\nĐã lưu ${saved} bản nháp (${withErrors} có lỗi cần xem kỹ). Thất bại: ${failed.length}.`);
  if (failed.length) console.log(failed.slice(0, 20).map((f) => `  - ${f}`).join("\n"));
  console.log(`Token: vào ${usage.input.toLocaleString()} · ra ${usage.output.toLocaleString()} · ghi cache ${usage.cacheWrite.toLocaleString()} · đọc cache ${usage.cacheRead.toLocaleString()}`);
  console.log(`Chi phí ước tính lô này: ~$${cost.toFixed(2)} (≈ $${(cost / Math.max(1, saved)).toFixed(4)}/sp → toàn catalog 3.180 sp ≈ $${((cost / Math.max(1, saved)) * 3180).toFixed(0)})`);
  console.log("Duyệt tại /admin/content-review");
}

async function main() {
  const [command, id] = process.argv.slice(2);
  if (command === "preview") return preview();
  if (command === "facts") return exportFacts();
  if (command === "import" && id) return importDrafts(id);
  if (command === "check" && id) return checkDrafts(id);
  if (command === "publish" && id) return publishDrafts(id);
  if (command === "estimate") return estimate();
  if (command === "submit") return submit();
  if (command === "status" && id) return status(id);
  if (command === "collect" && id) return collect(id);
  console.log("Lệnh: preview | facts | import <file> | check <file> | publish <file> | estimate | submit | status <batchId> | collect <batchId>  (xem đầu file)");
}

main()
  .catch((error) => {
    if (error instanceof Anthropic.AuthenticationError) console.error("Chưa có ANTHROPIC_API_KEY hợp lệ (hoặc chạy `ant auth login`).");
    else if (error instanceof Anthropic.RateLimitError) console.error("Bị giới hạn tốc độ — thử lại sau.");
    else if (error instanceof Anthropic.APIError) console.error(`Lỗi API ${error.status}: ${error.message}`);
    else console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
