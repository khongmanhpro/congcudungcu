#!/usr/bin/env node
/**
 * Kiểm tra SEO onpage theo mẫu từ sitemap.
 *   node scripts/seo-audit.mjs                       # http://localhost:3000
 *   node scripts/seo-audit.mjs https://congcudungcu.vn 8   # site thật, 8 mẫu / loại trang
 *
 * Kiểm: HTTP 200, title ≤ 65 ký tự, meta description 70–170, đúng 1 H1, canonical tuyệt đối cùng host,
 * không noindex (với trang trong sitemap), JSON-LD parse được và có @type phù hợp loại trang.
 */
const base = (process.argv[2] || "http://localhost:3000").replace(/\/+$/, "");
const perType = Number(process.argv[3] || 5);

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const typeOf = (path) =>
  path === "/" ? "home"
  : path.startsWith("/san-pham/") ? "product"
  : /^\/thuong-hieu\/[^/]+\/[^/]+/.test(path) ? "brand×category"
  : path.startsWith("/thuong-hieu/") ? "brand"
  : path.startsWith("/kien-thuc/") ? "post"
  : /^\/(chinh-sach|van-chuyen|phuong-thuc|tro-thanh)/.test(path) ? "policy"
  : ["/san-pham", "/thuong-hieu", "/kien-thuc", "/lien-he", "/cua-hang"].includes(path) ? "hub"
  : "category";
const EXPECTED_LD = { product: "Product", category: "CollectionPage", brand: "CollectionPage", "brand×category": "CollectionPage", home: "WebSite", post: "BlogPosting" };

const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const host = new URL(urls[0] ?? base).host;
const groups = {};
for (const url of urls) (groups[typeOf(new URL(url).pathname)] ??= []).push(url);

const sample = Object.values(groups).flatMap((list) => {
  const picked = [];
  for (let i = 0; i < Math.min(perType, list.length); i++) picked.push(list[Math.floor((i * list.length) / Math.min(perType, list.length))]);
  return picked;
});

console.log(`Sitemap: ${urls.length} URL · host ${host} · kiểm ${sample.length} mẫu (${perType}/loại)\n`);
const problems = [];
for (const url of sample) {
  const path = new URL(url).pathname;
  const type = typeOf(path);
  const fetchUrl = `${base}${path}`; // luôn gọi vào base (vd localhost) dù sitemap ghi domain thật
  const res = await fetch(fetchUrl, { redirect: "manual" });
  const html = await res.text();
  const issues = [];
  if (res.status !== 200) issues.push(`HTTP ${res.status}`);
  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
  const desc = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "");
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? "";
  const robots = html.match(/<meta name="robots" content="([^"]*)"/)?.[1] ?? "";
  const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
  if (!title) issues.push("thiếu title");
  else if (title.length > 65) issues.push(`title ${title.length} ký tự`);
  if (!desc) issues.push("thiếu description");
  else if (desc.length < 70 || desc.length > 170) issues.push(`description ${desc.length} ký tự`);
  if (h1 !== 1) issues.push(`${h1} thẻ H1`);
  if (!canonical) issues.push("thiếu canonical");
  else if (new URL(canonical).host !== host) issues.push(`canonical khác host: ${canonical}`);
  if (/noindex/.test(robots)) issues.push("noindex nhưng có trong sitemap");
  const types = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]);
      for (const item of Array.isArray(data) ? data : [data]) types.push(item["@type"]);
    } catch {
      issues.push("JSON-LD lỗi cú pháp");
    }
  }
  if (EXPECTED_LD[type] && !types.includes(EXPECTED_LD[type])) issues.push(`thiếu JSON-LD ${EXPECTED_LD[type]}`);
  console.log(`${issues.length ? "✗" : "✓"} [${type}] ${path}  (title ${title.length}, desc ${desc.length}, LD: ${types.join("/") || "-"})${issues.length ? "\n    → " + issues.join("; ") : ""}`);
  if (issues.length) problems.push({ path, issues });
}
console.log(`\n${problems.length === 0 ? "Không có lỗi." : `${problems.length}/${sample.length} trang có vấn đề.`}`);
process.exitCode = problems.length ? 1 : 0;
