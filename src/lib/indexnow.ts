import { absoluteUrl, getSiteUrl } from "@/lib/seo";

/**
 * IndexNow: báo ngay cho Bing/Yandex/Seznam… (Bing là nguồn của ChatGPT Search, Copilot)
 * khi URL được tạo/sửa. Bật bằng biến môi trường INDEXNOW_KEY (8–128 ký tự a-z, 0-9, -).
 * File xác minh khoá: /indexnow-key.txt (src/app/indexnow-key.txt/route.ts).
 */
export function getIndexNowKey(): string | null {
  const key = process.env["INDEXNOW_KEY"];
  return key && /^[a-zA-Z0-9-]{8,128}$/.test(key) ? key : null;
}

/** Gửi danh sách đường dẫn (tương đối hoặc tuyệt đối). Không bao giờ ném lỗi — chỉ log. */
export async function submitToIndexNow(paths: string[]): Promise<void> {
  const key = getIndexNowKey();
  const siteUrl = getSiteUrl();
  // chỉ chạy với domain thật (bỏ qua localhost / chưa cấu hình)
  if (!key || paths.length === 0 || /localhost|127\.0\.0\.1/.test(siteUrl)) return;
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(siteUrl).host,
        key,
        keyLocation: absoluteUrl("/indexnow-key.txt"),
        urlList: [...new Set(paths.map(absoluteUrl))].slice(0, 10000),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok && res.status !== 202) console.warn(`[indexnow] HTTP ${res.status}`);
  } catch (error) {
    console.warn("[indexnow] lỗi gửi:", error instanceof Error ? error.message : error);
  }
}

/** Gọi sau khi lưu — không chặn response trả về admin. */
export function pingIndexNow(paths: string[]): void {
  void submitToIndexNow(paths);
}
