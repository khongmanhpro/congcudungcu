import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Clock, Headphones, Mail, MapPin, Phone, ShieldCheck, Truck, User } from "lucide-react";
import { CartButton } from "./cart-button";
import { CategoryMenuDropdown, MobileCategoryDrawer } from "./category-menu-dropdown";
import { STANDARD_PRODUCT_CATEGORIES, type CatalogCategory } from "./catalog-categories";
import { NewsletterForm } from "./newsletter-form";
import { StoreNavLinks } from "./store-nav-links";
import { WishlistBadge } from "./wishlist-badge";
import { LiveSearch } from "./live-search";

export const dynamic = "force-dynamic";

const DEFAULT_TAGLINE = "Thiết Bị Công Nghiệp Chính Hãng 2026";
const DEFAULT_ADDRESS = "T2/D3B/31, Đường Bình Chuẩn 62, Khu phố Bình Thuận 2, Phường Thuận Giao, Thành phố Hồ Chí Minh";
const DEFAULT_PHONE = "0978.39.03.39";
const DEFAULT_HOTLINE = "0978.39.03.39";
const DEFAULT_BUSINESS_HOURS = "24/7";

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
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
            children: { orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { name: "asc" },
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

function Logo({ tagline }: { tagline: string }) {
  return (
    <Link href="/" className="flex min-w-0 shrink items-center gap-2.5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand text-lg font-bold text-gold ring-2 ring-gold/60 sm:h-12 sm:w-12 sm:text-xl">
        C
      </div>
      <div className="min-w-0">
        <div className="truncate text-[15px] font-bold uppercase leading-5 tracking-wide text-brand sm:text-lg">Công Cụ Dụng Cụ</div>
        <div className="hidden truncate text-[11px] font-semibold text-gold-dark sm:block">{tagline}</div>
      </div>
    </Link>
  );
}

export async function StoreHeader() {
  const [categories, settings] = await Promise.all([getCategoryTree(), getSettings()]);
  const contactHotline = settings.contact_hotline || DEFAULT_HOTLINE;
  const businessHours = settings.business_hours || DEFAULT_BUSINESS_HOURS;
  const siteTagline = settings.site_tagline || DEFAULT_TAGLINE;
  const flatCategories = categories.map(({ id, name, slug }) => ({ id, name, slug }));

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      {/* Thanh trên cùng */}
      <div className="bg-brand-dark text-[11px] font-semibold uppercase tracking-wide text-white/90">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between gap-3 px-3 sm:px-4">
          <span className="truncate">congcudungcu.vn · Tool &amp; Equipment</span>
          <div className="flex shrink-0 items-center gap-4">
            <span className="hidden items-center gap-1.5 sm:flex"><Clock className="h-3.5 w-3.5 text-gold" /> {businessHours}</span>
            <a href={`tel:${contactHotline.replace(/[^\d+]/g, "")}`} className="flex items-center gap-1.5 hover:text-gold">
              <Phone className="h-3.5 w-3.5 text-gold" /> {contactHotline}
            </a>
            <Link href="/tin-tuc" className="hidden hover:text-gold md:inline">Tin tức</Link>
            <Link href="/lien-he" className="hidden rounded-full bg-price px-3 py-0.5 text-white hover:bg-price/85 md:inline">Yêu cầu báo giá</Link>
          </div>
        </div>
      </div>

      {/* Logo + tìm kiếm + tài khoản/giỏ hàng */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-2.5 sm:gap-x-6 sm:px-4 md:py-3.5">
        <div className="flex min-w-0 items-center gap-1">
          <MobileCategoryDrawer categories={categories} />
          <Logo tagline={siteTagline} />
        </div>

        <LiveSearch categories={flatCategories} />

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link href="/tai-khoan" className="hidden items-center gap-2 rounded-md px-2 py-1.5 hover:bg-brand-50 md:flex">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand"><User className="h-5 w-5" /></span>
            <span className="text-xs leading-4">
              <span className="block text-[#667085]">Tài khoản</span>
              <strong className="text-[13px] text-brand">Đăng nhập</strong>
            </span>
          </Link>
          <WishlistBadge />
          <CartButton />
        </div>
      </div>

      {/* Thanh menu */}
      <nav className="bg-brand text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-3 text-[13px] font-bold uppercase sm:px-4">
          <CategoryMenuDropdown categories={categories} />
          <StoreNavLinks categories={flatCategories} />
        </div>
      </nav>
    </header>
  );
}

export async function StoreFooter() {
  const [settings, categories] = await Promise.all([getSettings(), getCategoryTree()]);
  const contactPhone = settings.contact_phone || DEFAULT_PHONE;
  const contactHotline = settings.contact_hotline || DEFAULT_HOTLINE;
  const contactEmail = settings.contact_email || "kinhdoanh@congcudungcu.vn";
  const contactAddress = settings.contact_address || DEFAULT_ADDRESS;
  const businessHours = settings.business_hours || DEFAULT_BUSINESS_HOURS;

  return (
    <footer className="mt-auto bg-brand-dark text-white">
      {/* Cam kết */}
      <div className="border-b border-white/10 bg-brand">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-4 text-[13px] font-semibold lg:grid-cols-4">
          {[
            { icon: Truck, label: "Giao hàng toàn quốc" },
            { icon: ShieldCheck, label: "Hàng chính hãng 100%" },
            { icon: Headphones, label: "Tư vấn kỹ thuật tận tâm" },
            { icon: Phone, label: `Hotline ${contactHotline}` },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <item.icon className="h-5 w-5 shrink-0 text-gold" />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div>
          <div className="mb-3 text-lg font-bold uppercase tracking-wide text-gold">Công Cụ Dụng Cụ</div>
          <ul className="space-y-2.5 text-[13px] text-white/80">
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{contactAddress}</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-gold" />{contactPhone}</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-gold" />{contactEmail}</li>
            <li className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0 text-gold" />Giờ làm việc: {businessHours}</li>
          </ul>
          <div className="mt-5 flex gap-2">
            {settings.social_facebook && <a href={settings.social_facebook} target="_blank" rel="noopener" aria-label="Facebook" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-sm font-bold hover:bg-gold hover:text-brand-dark">f</a>}
            {settings.social_youtube && <a href={settings.social_youtube} target="_blank" rel="noopener" aria-label="YouTube" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-xs font-bold hover:bg-gold hover:text-brand-dark">YT</a>}
            {settings.contact_zalo && <a href={settings.contact_zalo} target="_blank" rel="noopener" aria-label="Zalo" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-[10px] font-bold hover:bg-gold hover:text-brand-dark">Zalo</a>}
          </div>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase text-gold">Danh mục</h3>
          <ul className="space-y-2 text-[13px] text-white/80">
            {categories.slice(0, 7).map((category) => (
              <li key={category.id}><Link href={`/danh-muc/${category.slug}`} className="hover:text-gold">{category.name}</Link></li>
            ))}
            <li><Link href="/san-pham" className="hover:text-gold">Tất cả sản phẩm</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase text-gold">Chính sách</h3>
          <ul className="space-y-2 text-[13px] text-white/80">
            <li><Link href="/chinh-sach-bao-hanh" className="hover:text-gold">Chính sách bảo hành</Link></li>
            <li><Link href="/chinh-sach-doi-tra" className="hover:text-gold">Chính sách đổi trả</Link></li>
            <li><Link href="/van-chuyen" className="hover:text-gold">Chính sách vận chuyển</Link></li>
            <li><Link href="/thanh-toan" className="hover:text-gold">Chính sách thanh toán</Link></li>
            <li><Link href="/dieu-khoan" className="hover:text-gold">Điều khoản sử dụng</Link></li>
            <li><Link href="/tra-cuu-don-hang" className="hover:text-gold">Tra cứu đơn hàng</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase text-gold">Đăng ký nhận tin</h3>
          <p className="mb-4 text-[13px] leading-6 text-white/80">Nhận thông tin khuyến mãi và sản phẩm mới nhất từ chúng tôi.</p>
          <NewsletterForm />
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-4 py-4 text-xs text-white/60 md:flex-row">
          <p>© {new Date().getFullYear()} congcudungcu.vn. All rights reserved.</p>
          <p>COD · VNPay · Chuyển khoản</p>
        </div>
      </div>
    </footer>
  );
}
