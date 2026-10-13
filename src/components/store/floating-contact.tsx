import { Phone } from "lucide-react";

/** Nút liên hệ nổi: Zalo / Messenger (nếu có cấu hình) + hotline. */
export function FloatingContact({ hotline, zalo, messenger }: { hotline: string; zalo?: string; messenger?: string }) {
  const tel = hotline.replace(/[^\d+]/g, "");

  return (
    <div className="pointer-events-none fixed bottom-4 left-3 z-50 flex flex-col items-start gap-2.5 print:hidden sm:left-4">
      {zalo && (
        <a
          href={zalo}
          target="_blank"
          rel="noopener"
          aria-label="Chat Zalo"
          className="pointer-events-auto grid h-12 w-12 place-items-center rounded-full bg-[#0068ff] text-[11px] font-bold text-white shadow-lg ring-4 ring-[#0068ff]/20 transition hover:scale-105"
        >
          Zalo
        </a>
      )}
      {messenger && (
        <a
          href={messenger}
          target="_blank"
          rel="noopener"
          aria-label="Chat Messenger"
          className="pointer-events-auto grid h-12 w-12 place-items-center rounded-full bg-[#0866ff] text-[10px] font-bold text-white shadow-lg ring-4 ring-[#0866ff]/20 transition hover:scale-105"
        >
          Chat
        </a>
      )}
      <a
        href={`tel:${tel}`}
        className="pointer-events-auto flex items-center gap-2 rounded-full bg-price py-1.5 pl-1.5 pr-4 text-sm font-bold text-white shadow-lg transition hover:brightness-110"
      >
        <span className="grid h-8 w-8 animate-pulse place-items-center rounded-full bg-white/20">
          <Phone className="h-4 w-4" />
        </span>
        <span className="hidden sm:inline">Hotline:</span> {hotline}
      </a>
    </div>
  );
}
