import { ChevronDown } from "lucide-react";

export type FaqItem = { question: string; answer: string };

/** Đọc FAQ lưu dạng Json trong DB, bỏ mục rỗng/sai kiểu. */
export function parseFaq(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is FaqItem =>
      !!item && typeof item === "object" && typeof item.question === "string" && typeof item.answer === "string" && !!item.question.trim(),
  );
}

/** JSON-LD FAQPage — chỉ dùng khi FAQ được HIỂN THỊ trên trang (yêu cầu của Google). */
export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function FaqSection({ items, title = "Câu hỏi thường gặp" }: { items: FaqItem[]; title?: string }) {
  if (items.length === 0) return null;
  return (
    <section className="rounded-lg border border-gold bg-white p-4">
      <h2 className="mb-3 text-lg font-black text-[#0f172a]">{title}</h2>
      <div className="divide-y divide-[#e2e8f0]">
        {items.map((item, index) => (
          <details key={index} className="group py-2.5" open={index === 0}>
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-[15px] font-bold text-[#0f172a]">
              <h3>{item.question}</h3>
              <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-[#94a3b8] transition group-open:rotate-180" />
            </summary>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#334155]">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
