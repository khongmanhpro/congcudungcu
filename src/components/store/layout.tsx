import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ChevronDown, Headphones, Mail, MapPin, Phone, Truck, User } from "lucide-react";
import { CartButton } from "./cart-button";
import { CategoryMenuDropdown } from "./category-menu-dropdown";
import { STANDARD_PRODUCT_CATEGORIES } from "./catalog-categories";
import { NewsletterForm } from "./newsletter-form";
import { StoreNavLinks } from "./store-nav-links";
import { WishlistBadge } from "./wishlist-badge";
import { LiveSearch } from "./live-search";

export const dynamic = "force-dynamic";

const DEFAULT_TAGLINE = "Thiết Bị Công Nghiệp Chính Hãng 2026";
const DEFAULT_ADDRESS = "T2/D3B/31, Đường Bình Chuẩn 62, Khu phố Bình Thuận 2, Phường Thuận Giao, Thành phố Hồ Chí Minh";
const DEFAULT_PHONE = "0978.39.03.39";
const DEFAULT_HOTLINE = "+84 978.39.03.39";
const DEFAULT_BUSINESS_HOURS = "24/7";

async function getCategories() {
  const fallbackCategories = STANDARD_PRODUCT_CATEGORIES.map((category) => ({ ...category, children: [] }));

  try {
    const categories = await prisma.category.findMany({
      where: { type: "PRODUCT", parentId: null },
      include: { children: true },
      orderBy: { name: "asc" },
      take: 20,
    });
    return categories.length >= 8 ? categories : fallbackCategories;
  } catch {
    return fallbackCategories;
  }
}

async function getSettings() {
  try {
    const settings = await prisma.setting.findMany();
    return Object.fromEntries(settings.map((s) => [s.key, s.value]));
  } catch {
    return {};
  }
}

export async function StoreHeader() {
  const [categories, settings] = await Promise.all([getCategories(), getSettings()]);
  const contactPhone = settings.contact_phone || DEFAULT_PHONE;
  const contactHotline = settings.contact_hotline || DEFAULT_HOTLINE;
  const contactAddress = settings.contact_address || DEFAULT_ADDRESS;
  const businessHours = settings.business_hours || DEFAULT_BUSINESS_HOURS;
  const siteTagline = settings.site_tagline || DEFAULT_TAGLINE;

  return (
    <header className="sticky top-0 z-40 border-b border-[#dce5f1] bg-white shadow-sm">
      {/* Top bar */}
      <div className="bg-[#063f96] text-xs font-medium text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-3 py-2 sm:justify-between sm:px-4">
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Hotline: <strong>{contactHotline}</strong></span>
            <span className="hidden items-center gap-1.5 sm:flex">Điện thoại: <strong>{contactPhone}</strong></span>
            <span className="hidden items-center gap-1.5 md:flex"><Truck className="h-3.5 w-3.5" /> Giao hàng toàn quốc</span>
            <span className="hidden items-center gap-1.5 lg:flex"><MapPin className="h-3.5 w-3.5" /> {businessHours} · {contactAddress}</span>
          </div>
          <div className="hidden items-center gap-5 sm:flex">
            <Link href="/lien-he" className="hidden items-center gap-1.5 hover:text-[#ffb06b] sm:flex"><Headphones className="h-3.5 w-3.5" /> Hỗ trợ kỹ thuật</Link>
            <Link href="/tin-tuc" className="hidden hover:text-[#ffb06b] sm:inline">Tin tức</Link>
            <Link href="/tai-khoan" className="flex items-center gap-1 hover:text-[#ffb06b]">Tài khoản <ChevronDown className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-3 py-3 sm:gap-5 sm:px-4 sm:py-5">
        <Link href="/" className="flex min-w-0 shrink items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 rotate-45 place-items-center rounded-lg bg-[#0757c9] text-base font-black text-white sm:h-12 sm:w-12 sm:text-xl">
            <span className="-rotate-45">C</span>
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-black uppercase leading-5 text-[#0757c9] sm:text-xl">Công Cụ Dụng Cụ</div>
            <div className="hidden text-xs font-semibold text-[#667085] sm:block">{siteTagline}</div>
          </div>
        </Link>

        <LiveSearch categories={categories.map((category) => ({ id: category.id, name: category.name, slug: category.slug }))} />

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link href="/tai-khoan" className="hidden items-center gap-2 rounded-md px-2 py-2 hover:bg-[#f0f6ff] md:flex">
            <User className="h-5 w-5 text-[#1d2939]" />
            <span className="text-sm leading-4">
              <strong className="block text-[#1d2939]">Đăng nhập</strong>
              <span className="text-xs text-[#0757c9]">Tài khoản</span>
            </span>
          </Link>
          <WishlistBadge />
          <CartButton />
        </div>
      </div>

      {/* Nav */}
      <nav className="border-t border-[#edf1f7] bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 text-sm font-bold sm:px-4">
          <CategoryMenuDropdown categories={categories.map((category) => ({ id: category.id, name: category.name, slug: category.slug }))} />
          <StoreNavLinks categories={categories.map((category) => ({ id: category.id, name: category.name, slug: category.slug }))} />
        </div>
      </nav>
    </header>
  );
}

export async function StoreFooter() {
  const settings = await getSettings();
  const categories = await getCategories();
  const contactPhone = settings.contact_phone || DEFAULT_PHONE;
  const contactHotline = settings.contact_hotline || DEFAULT_HOTLINE;
  const contactEmail = settings.contact_email || "kinhdoanh@congcudungcu.vn";
  const contactAddress = settings.contact_address || DEFAULT_ADDRESS;
  const businessHours = settings.business_hours || DEFAULT_BUSINESS_HOURS;

  return (
    <footer className="mt-auto bg-[#063f96] text-white">
      <div className="mx-auto grid max-w-7xl gap-7 px-4 py-8 md:grid-cols-[1.25fr_1.25fr_.9fr_.9fr_1.25fr] md:py-10">
        <div>
          <div className="mb-3 text-lg font-black uppercase">Công Cụ Dụng Cụ</div>
          <p className="text-sm leading-6 text-white/78">
            {settings.site_tagline || DEFAULT_TAGLINE}
          </p>
          <div className="mt-5 flex gap-2">
            {settings.social_facebook && <a href={settings.social_facebook} target="_blank" rel="noopener" aria-label="Facebook" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-sm font-black hover:bg-white/20">f</a>}
            {settings.social_youtube && <a href={settings.social_youtube} target="_blank" rel="noopener" aria-label="YouTube" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-sm font-black hover:bg-white/20">YT</a>}
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-black uppercase md:mb-4">Thông tin liên hệ</h3>
          <ul className="space-y-2 text-sm text-white/78">
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{contactAddress}</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" />{contactPhone}</li>
            <li className="flex items-center gap-2"><Headphones className="h-4 w-4" />Hotline: {contactHotline}</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" />{contactEmail}</li>
            <li>Giờ làm việc: {businessHours}</li>
            <li>www.congcudungcu.vn</li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-black uppercase md:mb-4">Danh mục</h3>
          <ul className="space-y-2 text-sm text-white/78">
            {categories.slice(0, 5).map((category) => (
              <li key={category.id}><Link href={`/danh-muc/${category.slug}`} className="hover:text-white">{category.name}</Link></li>
            ))}
            <li><Link href="/san-pham" className="hover:text-white">Xem thêm...</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-black uppercase md:mb-4">Chính sách</h3>
          <ul className="space-y-2 text-sm text-white/78">
            <li><Link href="/chinh-sach-bao-hanh" className="hover:text-white">Chính sách bảo hành</Link></li>
            <li><Link href="/chinh-sach-doi-tra" className="hover:text-white">Chính sách đổi trả</Link></li>
            <li><Link href="/van-chuyen" className="hover:text-white">Chính sách vận chuyển</Link></li>
            <li><Link href="/thanh-toan" className="hover:text-white">Chính sách thanh toán</Link></li>
            <li><Link href="/dieu-khoan" className="hover:text-white">Điều khoản sử dụng</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-black uppercase md:mb-4">Đăng ký nhận tin</h3>
          <p className="mb-4 text-sm leading-6 text-white/78">Nhận thông tin khuyến mãi và sản phẩm mới nhất từ chúng tôi.</p>
          <NewsletterForm />
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-4 py-5 text-xs text-white/70 md:flex-row">
          <p>© {new Date().getFullYear()} Công Cụ Dụng Cụ. All rights reserved.</p>
          <p>VISA · Mastercard · ATM · MoMo · VNPay</p>
        </div>
      </div>
    </footer>
  );
}
