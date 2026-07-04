/** Định dạng tiền VND: 1290000 -> "1.290.000₫" */
export function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Định dạng số: 1290000 -> "1.290.000" */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

/** Định dạng ngày: 2026-07-02 -> "02/07/2026" */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/** Định dạng ngày giờ: 2026-07-02T15:30 -> "02/07/2026 15:30" */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
