import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { User } from "lucide-react";
import { CartButton } from "./cart-button";
import { CategoryNavBar, MobileCategoryDrawer } from "./category-menu-dropdown";
import { STANDARD_PRODUCT_CATEGORIES, type CatalogCategory } from "./catalog-categories";
import { LiveSearch } from "./live-search";

export const dynamic = "force-dynamic";

const DEFAULT_ADDRESS = "T2/D3B/31, Đường Bình Chuẩn 62, Khu phố Bình Thuận 2, Phường Thuận Giao, Thành phố Hồ Chí Minh";
const DEFAULT_HOTLINE = "0978.39.03.39";
const DEFAULT_EMAIL = "kinhdoanh@congcudungcu.vn";

/** Cây danh mục sản phẩm 3 cấp cho menu. Rơi về danh sách mặc định khi DB trống/lỗi. */
export async function getCategoryTree(): Promise<CatalogCategory[]> {
  try {
    const categories = await prisma.category.findMany({
      where: { type: "PRODUCT", parentId: null },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        children: {
          orderBy: [{ position: "asc" }, { name: "asc" }],
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            children: { orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } },
          },
        },
      },
      // thứ tự theo taxonomy (scripts/content/taxonomy.ts → Category.position)
      orderBy: [{ position: "asc" }, { name: "asc" }],
      take: 30,
    });
    return categories.length > 0 ? categories : STANDARD_PRODUCT_CATEGORIES;
  } catch {
    return STANDARD_PRODUCT_CATEGORIES;
  }
}

export async function getSettings(): Promise<Record<string, string>> {
  try {
    const settings = await prisma.setting.findMany();
    return Object.fromEntries(settings.map((s) => [s.key, s.value]));
  } catch {
    return {};
  }
}

/** Đọc cấu hình dạng nhiều dòng "a | b | c" thành mảng các cột (bỏ dòng trống). */
export function parsePipeLines(value: string | undefined): string[][] {
  return (value || "")
    .split("\n")
    .map((line) => line.split("|").map((cell) => cell.trim()))
    .filter((cells) => cells[0]);
}

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export async function StoreHeader() {
  const [categories, settings] = await Promise.all([getCategoryTree(), getSettings()]);
  const hotline = settings.contact_hotline || DEFAULT_HOTLINE;
  const email = settings.contact_email || DEFAULT_EMAIL;

  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_1px_0_#e2e8f0]">
      {/* Thanh trên cùng */}
      <div className="border-b border-[#e2e8f0] text-xs text-[#334155]">
        <div className="mx-auto flex h-8 max-w-7xl items-center gap-2 px-3 sm:px-4">
          <span>Hotline: <a href={telHref(hotline)} className="font-bold text-[#16a34a] hover:underline">{hotline}</a></span>
          <span className="hidden text-[#cbd5e1] sm:inline">|</span>
          <span className="hidden sm:inline">Email: <a href={`mailto:${email}`} className="font-bold text-[#0f172a] hover:underline">{email}</a></span>
        </div>
      </div>

      {/* Logo + tìm kiếm + nút */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 sm:px-4 md:flex-nowrap">
        <div className="flex min-w-0 flex-1 items-center gap-1 md:w-[200px] md:flex-none">
          <MobileCategoryDrawer categories={categories} />
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand text-lg font-black text-gold">C</span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[15px] font-black uppercase text-brand">Công Cụ Dụng Cụ</span>
              <span className="block truncate text-[11px] font-medium text-[#475569]">congcudungcu.vn</span>
            </span>
          </Link>
        </div>

        <LiveSearch categories={categories.map(({ id, name, slug }) => ({ id, name, slug }))} />

        <div className="flex shrink-0 items-center gap-2">
          {settings.social_messenger && (
            <a href={settings.social_messenger} target="_blank" rel="noopener" aria-label="Chat Messenger" className="hidden h-10 w-10 place-items-center rounded-full bg-[#0084ff] text-[10px] font-bold text-white shadow sm:grid">
              Chat
            </a>
          )}
          {settings.contact_zalo && (
            <a href={settings.contact_zalo} target="_blank" rel="noopener" aria-label="Chat Zalo" className="hidden h-10 w-10 place-items-center rounded-full bg-[#0068ff] text-[10px] font-bold text-white shadow sm:grid">
              Zalo
            </a>
          )}
          <span className="mx-1 hidden h-7 w-px bg-[#e2e8f0] sm:block" />
          <Link href="/tai-khoan" aria-label="Tài khoản" className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#0f172a] shadow-[0_2px_10px_rgba(15,23,42,.12)] hover:text-brand">
            <User className="h-5 w-5" />
          </Link>
          <CartButton />
        </div>
      </div>

      {/* Thanh danh mục */}
      <nav className="bg-brand">
        <div className="mx-auto max-w-7xl sm:px-4">
          <CategoryNavBar categories={categories} extras={[{ name: "Thư viện Media", href: "/kien-thuc" }]} />
        </div>
      </nav>
    </header>
  );
}

export async function StoreFooter() {
  const settings = await getSettings();
  const hotline = settings.contact_hotline || DEFAULT_HOTLINE;
  const address = settings.contact_address || DEFAULT_ADDRESS;
  const contacts = parsePipeLines(settings.footer_contacts);
  const staff = contacts.length > 0 ? contacts : [["Hotline", hotline]];
  const sites = parsePipeLines(settings.footer_sites);
  const policies = [
    { name: "Chính sách bán hàng", href: "/chinh-sach-ban-hang" },
    { name: "Phương thức thanh toán", href: "/phuong-thuc-thanh-toan" },
    { name: "Chính sách bảo mật", href: "/chinh-sach-bao-mat" },
    { name: "Chính sách đổi trả", href: "/chinh-sach-doi-tra" },
    { name: "Chính sách bảo hành", href: "/chinh-sach-bao-hanh" },
    { name: "Trở thành đại lý", href: "/tro-thanh-dai-ly" },
  ];

  return (
    <footer className="mt-auto border-t border-gold bg-[#f8fafc] pt-3">
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        {/* Thanh chính sách */}
        <nav className="grid grid-cols-2 overflow-hidden rounded-md border border-gold bg-gold sm:grid-cols-3 lg:grid-cols-6">
          {policies.map((policy) => (
            <Link
              key={policy.href}
              href={policy.href}
              className="border-b border-r border-brand-dark/10 px-2 py-3 text-center text-sm font-bold text-brand-dark transition hover:bg-gold-dark"
            >
              {policy.name}
            </Link>
          ))}
        </nav>

        {/* Nhân viên kinh doanh */}
        <div className="flex gap-2 overflow-x-auto py-4 [scrollbar-width:none] sm:justify-center">
          {staff.map(([name, phone]) => (
            <a key={`${name}-${phone}`} href={telHref(phone || name)} className="flex w-[104px] shrink-0 flex-col items-center gap-1 text-center">
              <span className="h-11 w-11 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff3d6,#e2a749_55%,#c98d2e)] shadow" />
              <span className="text-[13px] font-bold text-price">{phone || name}</span>
              {phone && <span className="text-[11px] font-medium text-[#475569]">{name}</span>}
            </a>
          ))}
        </div>

        {sites.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 pb-4">
            {sites.map(([name, href]) => (
              <a key={name} href={href || `https://${name}`} target="_blank" rel="noopener" className="rounded bg-white px-5 py-1.5 text-xs font-bold text-brand shadow-sm ring-1 ring-[#e2e8f0] hover:ring-gold">
                {name}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[#e2e8f0] bg-[#eef2f7]">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-3 py-3 text-xs text-[#334155] sm:px-4 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} congcudungcu.vn</p>
          <div className="md:text-right">
            <p className="font-bold uppercase text-[#0f172a]">{settings.company_name || "Công Cụ Dụng Cụ"}</p>
            <p className="text-[11px]">{address}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
