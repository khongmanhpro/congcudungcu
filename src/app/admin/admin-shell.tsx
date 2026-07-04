"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Box,
  ExternalLink,
  FilePenLine,
  FileText,
  FolderTree,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  SearchCheck,
  Settings,
  ShoppingCart,
  Star,
  Tag,
  Ticket,
  Users,
} from "lucide-react";

type AdminUser = {
  name: string | null;
  email: string;
  role: string;
};

const groups = [
  {
    label: "Tổng quan",
    items: [
      { href: "/admin", label: "Bảng điều khiển", icon: LayoutDashboard, exact: true },
      { href: "/admin/reports/revenue", label: "Báo cáo doanh thu", icon: BarChart3 },
    ],
  },
  {
    label: "Nội dung & SEO",
    items: [
      { href: "/admin/posts", label: "Bài viết", icon: FileText },
      { href: "/admin/categories", label: "Danh mục", icon: FolderTree },
      { href: "/admin/media", label: "Media", icon: ImageIcon },
      { href: "/admin/settings", label: "Cài đặt SEO", icon: SearchCheck },
    ],
  },
  {
    label: "Bán hàng",
    items: [
      { href: "/admin/products", label: "Sản phẩm", icon: Package },
      { href: "/admin/brands", label: "Thương hiệu", icon: Tag },
      { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingCart },
      { href: "/admin/coupons", label: "Mã giảm giá", icon: Ticket },
      { href: "/admin/customers", label: "Khách hàng", icon: Users },
    ],
  },
  {
    label: "Chăm sóc",
    items: [
      { href: "/admin/reviews", label: "Đánh giá", icon: Star },
      { href: "/admin/quote-requests", label: "Liên hệ/Báo giá", icon: Inbox },
      { href: "/admin/settings", label: "Cài đặt website", icon: Settings },
    ],
  },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ user, children }: { user: AdminUser; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#eef2f7] text-[#172033]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[292px] border-r border-[#d8e0ec] bg-[#071a33] text-white lg:flex lg:flex-col">
        <div className="border-b border-white/10 px-5 py-5">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-[#0757c9]">
              <Box className="h-6 w-6" />
            </div>
            <div>
              <div className="text-base font-black uppercase tracking-wide">CDC Admin</div>
              <div className="text-xs text-white/58">Commerce control room</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {groups.map((group) => (
            <div key={group.label} className="mb-5">
              <div className="mb-2 px-3 text-[11px] font-black uppercase tracking-[0.14em] text-white/38">{group.label}</div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(pathname, item.href, item.exact);
                  return (
                    <Link
                      key={`${group.label}-${item.href}-${item.label}`}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-bold transition ${
                        active ? "bg-[#0757c9] text-white shadow-[inset_3px_0_0_#ff7417]" : "text-white/72 hover:bg-white/8 hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-md bg-white/7 p-3">
            <div className="text-sm font-bold">{user.name || "Quản trị viên"}</div>
            <div className="mt-1 truncate text-xs text-white/55">{user.email}</div>
            <div className="mt-2 inline-flex rounded bg-white/10 px-2 py-1 text-[10px] font-black uppercase text-white/70">{user.role}</div>
          </div>
          <form action="/api/auth/logout-form" method="post" className="mt-3">
            <button type="submit" className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-bold text-white/70 hover:bg-white/8 hover:text-white">
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-[292px]">
        <header className="sticky top-0 z-30 border-b border-[#d8e0ec] bg-white/95 backdrop-blur">
          <div className="flex min-h-16 flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-7">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.14em] text-[#0757c9]">Quản trị website</div>
              <div className="text-sm text-[#667085]">Quản lý bán hàng, nội dung, SEO và vận hành kho</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/" target="_blank" className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d8e0ec] bg-white px-3 text-sm font-bold text-[#344054] hover:bg-[#f7faff]">
                <ExternalLink className="h-4 w-4" />
                Xem website
              </Link>
              <Link href="/admin/posts/new" className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d8e0ec] bg-white px-3 text-sm font-bold text-[#344054] hover:bg-[#f7faff]">
                <FilePenLine className="h-4 w-4" />
                Viết bài
              </Link>
              <Link href="/admin/products/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0757c9] px-3 text-sm font-black text-white hover:bg-[#0048a8]">
                <Plus className="h-4 w-4" />
                Thêm sản phẩm
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] px-4 py-6 lg:px-7">{children}</main>
      </div>
    </div>
  );
}
