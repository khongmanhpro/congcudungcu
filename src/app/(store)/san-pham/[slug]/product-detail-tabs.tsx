"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle, MessageSquareText } from "lucide-react";
import { ProductReviews } from "./product-reviews";

type DetailTab = "description" | "specs" | "reviews" | "qa";

const tabs: { id: DetailTab; label: string }[] = [
  { id: "description", label: "Mô tả sản phẩm" },
  { id: "specs", label: "Thông số kỹ thuật" },
  { id: "reviews", label: "Đánh giá" },
  { id: "qa", label: "Hỏi đáp" },
];

export function ProductDetailTabs({
  descriptionHtml,
  shortDesc,
  specsItems,
  productId,
  faq = [],
}: {
  descriptionHtml: string;
  shortDesc: string | null;
  specsItems: { label: string; value: string }[];
  productId: string;
  faq?: { question: string; answer: string }[];
}) {
  const [active, setActive] = useState<DetailTab>("description");

  return (
    <section className="mt-5 overflow-hidden rounded-md border border-[#dce5f1] bg-white sm:mt-8">
      <div className="flex overflow-x-auto border-b border-[#dce5f1] text-xs font-black uppercase text-[#172033] sm:text-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            aria-controls={`tab-${tab.id}`}
            onClick={() => setActive(tab.id)}
            className={`shrink-0 border-b-2 px-4 py-3 text-left transition sm:px-6 sm:py-4 ${
              active === tab.id
                ? "border-brand text-brand"
                : "border-transparent hover:text-brand"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Mô tả, thông số, hỏi đáp luôn render sẵn (Google/AI đọc được), tab chỉ ẩn/hiện */}
        <section id="tab-description" role="tabpanel" hidden={active !== "description"}>
            <h2 className="mb-5 text-xl font-black text-[#172033]">Mô tả sản phẩm</h2>
            {descriptionHtml ? (
              <div
                className="prose prose-sm max-w-none text-[#344054] lg:prose-base [&_img]:mx-auto [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md [&_img]:border [&_img]:border-[#dce5f1] [&_p]:leading-7"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            ) : (
              <p className="text-sm leading-7 text-[#667085]">{shortDesc || "Sản phẩm đang được cập nhật mô tả."}</p>
            )}
        </section>

        <section id="tab-specs" role="tabpanel" hidden={active !== "specs"}>
            <h2 className="mb-5 text-xl font-black text-[#172033]">Thông số kỹ thuật</h2>
            {specsItems.length > 0 ? (
              <div className="overflow-hidden rounded-md border border-[#dce5f1]">
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    {specsItems.map((item, index) => (
                      <tr key={`${item.label}-${index}`} className={index % 2 === 0 ? "bg-brand-50" : "bg-white"}>
                        <td className="w-1/3 border-b border-[#dce5f1] px-4 py-3 font-bold text-[#667085]">{item.label}</td>
                        <td className="border-b border-[#dce5f1] px-4 py-3 text-[#172033]">{item.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-[#667085]">Thông số kỹ thuật đang được cập nhật.</p>
            )}
        </section>

        {/* đánh giá tải phía client khi mở tab */}
        {active === "reviews" && (
          <section id="tab-reviews" role="tabpanel">
            <ProductReviews productId={productId} />
          </section>
        )}

        <section id="tab-qa" role="tabpanel" hidden={active !== "qa"}>
          {faq.length > 0 && (
            <div className="mb-5">
              <h2 className="mb-3 text-xl font-black text-[#172033]">Câu hỏi thường gặp</h2>
              <dl className="divide-y divide-[#e2e8f0] rounded-md border border-[#e2e8f0]">
                {faq.map((item, index) => (
                  <div key={index} className="p-4">
                    <dt className="text-[15px] font-bold text-[#0f172a]">{item.question}</dt>
                    <dd className="mt-1.5 whitespace-pre-line text-sm leading-6 text-[#334155]">{item.answer}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <div className="rounded-md bg-brand-50 p-5">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-50 text-brand">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#172033]">Bạn có câu hỏi khác?</h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085]">
                  Gửi câu hỏi về thông số, tồn kho, bảo hành hoặc báo giá. Đội ngũ tư vấn sẽ phản hồi theo thông tin liên hệ của bạn.
                </p>
                <Link
                  href="/lien-he"
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded bg-brand px-5 text-sm font-black uppercase text-white hover:bg-brand-dark"
                >
                  <MessageSquareText className="h-4 w-4" />
                  Gửi câu hỏi
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
