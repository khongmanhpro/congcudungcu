import { MessageCircle, Phone } from "lucide-react";

/** Cột nút liên hệ nổi bên phải: Messenger, Zalo, Facebook (nếu có cấu hình) + gọi hotline. */
export function FloatingContact({ hotline, zalo, messenger, facebook }: { hotline: string; zalo?: string; messenger?: string; facebook?: string }) {
  const button = "pointer-events-auto grid h-11 w-11 place-items-center rounded-full text-white shadow-[0_4px_14px_rgba(0,0,0,.25)] ring-4 ring-white/60 transition hover:scale-110";

  return (
    <div className="pointer-events-none fixed bottom-5 right-3 z-50 flex flex-col items-center gap-3 print:hidden sm:right-5">
      {messenger && (
        <a href={messenger} target="_blank" rel="noopener" aria-label="Chat Messenger" className={`${button} bg-gold text-brand-dark`}>
          <MessageCircle className="h-5 w-5 fill-current" />
        </a>
      )}
      {zalo && (
        <a href={zalo} target="_blank" rel="noopener" aria-label="Chat Zalo" className={`${button} bg-[#0068ff] text-[11px] font-black`}>
          Zalo
        </a>
      )}
      {facebook && (
        <a href={facebook} target="_blank" rel="noopener" aria-label="Facebook" className={`${button} bg-[#1877f2] text-lg font-black`}>
          f
        </a>
      )}
      <a href={`tel:${hotline.replace(/[^\d+]/g, "")}`} aria-label={`Gọi ${hotline}`} className={`${button} bg-[#16a34a]`}>
        <Phone className="h-5 w-5 fill-current" />
      </a>
    </div>
  );
}
