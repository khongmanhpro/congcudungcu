import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { categoryPath } from "@/lib/urls";

export type LinkTerm = { term: string; path: string };

const SAFE_SINGLE_WORDS = new Set(["kìm", "búa", "taro"]);

/**
 * Cụm từ → đường dẫn danh mục, dùng để tự gắn link nội bộ trong bài viết.
 * Tên ghép ("Kìm điện & kìm tổng hợp") tách thành từng cụm; bỏ cụm chung chung ("… khác").
 */
export const getCategoryLinkTerms = cache(async (): Promise<LinkTerm[]> => {
  const categories = await prisma.category
    .findMany({ where: { type: "PRODUCT" }, select: { name: true, slug: true, parent: { select: { slug: true } } } })
    .catch(() => []);
  const terms: LinkTerm[] = [];
  for (const c of categories) {
    const path = categoryPath(c);
    for (const part of c.name.split(/\s*(?:&|,|\(|\))\s*/)) {
      const term = part.trim();
      if (term.length < 3 || /khác|chuyên dụng|tổng hợp$/i.test(term) && term.split(" ").length < 2) continue;
      if (/\bkhác\b/i.test(term)) continue;
      // cụm 1 từ dễ nhầm nghĩa ("kéo" = động từ kéo, "dao", "đèn") — chỉ giữ vài từ an toàn
      if (!term.includes(" ") && !SAFE_SINGLE_WORDS.has(term.toLowerCase())) continue;
      terms.push({ term, path });
    }
  }
  // cụm dài trước (cụ thể hơn): "cờ lê vòng miệng" trước "cờ lê"
  return terms.sort((a, b) => b.term.length - a.term.length);
});

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SKIP_TAGS = new Set(["a", "h1", "h2", "h3", "h4", "script", "style", "code"]);

/**
 * Gắn link cho lần xuất hiện ĐẦU TIÊN của mỗi cụm từ trong phần chữ (không trong <a>, tiêu đề).
 * Mỗi đường dẫn tối đa 1 link; không link tới chính `currentPath`; tổng tối đa `maxLinks`.
 * Trả về HTML mới + danh sách đường dẫn danh mục mà bài viết nhắc tới (kể cả link có sẵn).
 */
export function autolinkHtml(html: string, terms: LinkTerm[], options: { maxLinks?: number; currentPath?: string } = {}) {
  const maxLinks = options.maxLinks ?? 10;
  const termPaths = new Set(terms.map((t) => t.path));
  const linked = new Set<string>();
  // link có sẵn trong bài cũng được tính (không link trùng)
  for (const m of html.matchAll(/<a\b[^>]*href="([^"#?]+)/gi)) if (termPaths.has(m[1])) linked.add(m[1]);

  // Tách HTML: thẻ giữ nguyên; đoạn chữ ngoài <a>/<h1-4> thành danh sách mảnh {text, locked}
  type Piece = { text: string; locked: boolean };
  const nodes: (string | Piece[])[] = [];
  const skipStack: string[] = [];
  for (const part of html.split(/(<[^>]+>)/)) {
    if (part.startsWith("<")) {
      const tag = part.match(/^<\/?\s*([a-z0-9]+)/i)?.[1]?.toLowerCase();
      if (tag && SKIP_TAGS.has(tag)) {
        if (part.startsWith("</")) skipStack.pop();
        else if (!part.endsWith("/>")) skipStack.push(tag);
      }
      nodes.push(part);
    } else {
      nodes.push(skipStack.length || !part.trim() ? part : [{ text: part, locked: false }]);
    }
  }

  let added = 0;
  for (const { term, path } of terms) {
    if (added >= maxLinks) break;
    if (linked.has(path) || path === options.currentPath) continue;
    // ranh giới chữ Unicode (tiếng Việt có dấu)
    const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRegex(term)})(?=$|[^\\p{L}\\p{N}])`, "iu");
    // lần đầu → link; các lần sau → khoá (không link) để cụm ngắn hơn ("kìm") không chen vào giữa "kìm cắt"
    let done = false;
    for (const node of nodes) {
      if (typeof node === "string") continue;
      for (let i = 0; i < node.length; i++) {
        const piece = node[i];
        if (piece.locked) continue;
        const m = piece.text.match(re);
        if (!m || m.index === undefined) continue;
        const start = m.index + m[1].length;
        const matched = done ? m[2] : `<a href="${path}">${m[2]}</a>`;
        node.splice(
          i,
          1,
          { text: piece.text.slice(0, start), locked: false },
          { text: matched, locked: true },
          { text: piece.text.slice(start + m[2].length), locked: false },
        );
        i++; // bỏ qua mảnh vừa khoá, xét tiếp phần sau
        if (!done) {
          done = true;
          linked.add(path);
          added++;
        }
      }
    }
  }

  const out = nodes.map((node) => (typeof node === "string" ? node : node.map((piece) => piece.text).join(""))).join("");
  return { html: out, paths: [...linked] };
}
