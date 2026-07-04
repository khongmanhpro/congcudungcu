"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle, MessageSquareText, Star } from "lucide-react";
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
}: {
  descriptionHtml: string;
  shortDesc: string | null;
  specsItems: { label: string; value: string }[];
  productId: string;
}) {
  const [active, setActive] = useState<DetailTab>("description");

  return (
    <section className="mt-5 overflow-hidden rounded-md border border-[#dce5f1] bg-white sm:mt-8">
      <div className="flex overflow-x-auto border-b border-[#dce5f1] text-xs font-black uppercase text-[#172033] sm:text-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`shrink-0 border-b-2 px-4 py-3 text-left transition sm:px-6 sm:py-4 ${
              active === tab.id
                ? "border-[#0757c9] text-[#0757c9]"
                : "border-transparent hover:text-[#0757c9]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {active === "description" && (
          <section>
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
        )}

        {active === "specs" && (
          <section>
            <h2 className="mb-5 text-xl font-black text-[#172033]">Thông số kỹ thuật</h2>
            {specsItems.length > 0 ? (
              <div className="overflow-hidden rounded-md border border-[#dce5f1]">
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    {specsItems.map((item, index) => (
                      <tr key={`${item.label}-${index}`} className={index % 2 === 0 ? "bg-[#f8fbff]" : "bg-white"}>
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
        )}

        {active === "reviews" && (
          <section>
            <ProductReviews productId={productId} />
          </section>
        )}

        {active === "qa" && (
          <section className="rounded-md bg-[#f8fbff] p-5">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eaf3ff] text-[#0757c9]">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#172033]">Hỏi đáp sản phẩm</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085]">
                  Gửi câu hỏi về thông số, tồn kho, bảo hành hoặc báo giá. Đội ngũ tư vấn sẽ phản hồi theo thông tin liên hệ của bạn.
                </p>
                <Link
                  href="/lien-he"
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded bg-[#0757c9] px-5 text-sm font-black uppercase text-white hover:bg-[#0048a8]"
                >
                  <MessageSquareText className="h-4 w-4" />
                  Gửi câu hỏi
                </Link>
              </div>
            </div>
          </section>
        )}

        {active === "reviews" && (
          <div className="mt-6 hidden rounded-md bg-[#f8fbff] p-5 text-[#ffae00] lg:block">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} className="inline h-4 w-4 fill-current" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
