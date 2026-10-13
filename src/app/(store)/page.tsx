import Link from "next/link";
import { ArrowRight, BadgePercent, FileText, Gift, Headphones, PlayCircle, ShieldCheck, Sparkles, Star, Truck, Wallet } from "lucide-react";
import { CategorySidebar } from "@/components/store/category-menu-dropdown";
import { getCategoryTree, getSettings } from "@/components/store/layout";
import { ProductCard } from "@/components/store/product-card";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

const productInclude = {
  images: { take: 1, orderBy: { position: "asc" as const } },
  brand: { select: { name: true } },
  category: { select: { name: true } },
};

/** Nhận ID hoặc link YouTube (watch?v=, youtu.be/, shorts/, embed/) → ID video. */
function youtubeId(value: string) {
  const v = value.trim();
  const match = v.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/);
  if (match) return match[1];
  return /^[\w-]{11}$/.test(v) ? v : null;
}

export default async function HomePage() {
  const [categoryTree, settings, featured, onSale, newest, brands, posts, categoryCounts] = await Promise.all([
    getCategoryTree(),
    getSettings(),
    prisma.product.findMany({
      where: { status: "PUBLISHED", featured: true },
      take: 12,
      include: productInclude,
      orderBy: { updatedAt: "desc" },
    }).catch(() => []),
    prisma.product.findMany({
      where: { status: "PUBLISHED", salePrice: { gt: 0 } },
      take: 12,
      include: productInclude,
      orderBy: { updatedAt: "desc" },
    }).catch(() => []),
    prisma.product.findMany({
      where: { status: "PUBLISHED" },
      take: 12,
      include: productInclude,
      orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    }).catch(() => []),
    prisma.brand.findMany({ orderBy: { name: "asc" }, take: 16 }).catch(() => []),
    prisma.post.findMany({
      where: { status: "PUBLISHED" },
      take: 4,
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, publishedAt: true },
    }).catch(() => []),
    prisma.product.groupBy({ by: ["categoryId"], where: { status: "PUBLISHED" }, _count: { _all: true } }).catch(() => []),
  ]);

  // Số sản phẩm của mỗi danh mục cha = cộng dồn cả cây con.
  const countById = new Map(categoryCounts.map((row) => [row.categoryId, row._count._all]));
  const subtreeCount = (category: (typeof categoryTree)[number]): number =>
    (countById.get(category.id) ?? 0) + (category.children ?? []).reduce((sum, child) => sum + subtreeCount(child), 0);
  const featuredCategories = categoryTree
    .map((category) => ({ ...category, count: subtreeCount(category) }))
    .filter((category) => category.count > 0 || categoryTree.length <= 12)
    .slice(0, 12);

  const highlight = featured.length > 0 ? featured : newest;
  const heroImages = highlight.flatMap((product) => (product.images[0] ? [{ url: product.images[0].url, alt: product.name }] : [])).slice(0, 3);
  const hotline = settings.contact_hotline || "0978.39.03.39";
  const videos = (settings.home_youtube_videos || "").split(",").map(youtubeId).filter((id): id is string => !!id).slice(0, 4);

  return (
    <div className="bg-[#f3f5f9] pb-10 text-[#101828]">
      {/* Hero: danh mục + banner + cột tư vấn */}
      <div className="mx-auto max-w-7xl px-3 pt-4 sm:px-4">
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_240px]">
          <CategorySidebar categories={categoryTree} />

          <section className="relative flex min-h-[300px] overflow-hidden rounded-lg bg-brand-dark text-white sm:min-h-[380px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_40%,rgba(226,167,73,.28),transparent_32%),linear-gradient(115deg,#061b3d_0%,#003869_55%,#0b4f8f_100%)]" />
            <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:36px_36px]" />
            <div className="relative grid w-full items-center gap-6 px-5 py-8 sm:px-10 md:grid-cols-[1.1fr_1fr]">
              <div>
                <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gold">
                  <Sparkles className="h-3.5 w-3.5" /> {settings.site_tagline || "Thiết bị công nghiệp chính hãng"}
                </p>
                <h1 className="text-2xl font-bold uppercase leading-tight sm:text-[34px] xl:text-[30px]">
                  Giải pháp dụng cụ
                  <span className="block text-gold">& thiết bị chuyên nghiệp</span>
                </h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-white/85">
                  Dụng cụ cầm tay, thiết bị đo lường, máy móc và thiết bị garage chính hãng cho thợ nghề, xưởng sản xuất và doanh nghiệp.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/san-pham" className="inline-flex items-center gap-2 rounded-md bg-gold px-5 py-3 text-sm font-bold uppercase text-brand-dark transition hover:bg-gold-dark">
                    Xem sản phẩm <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/lien-he" className="inline-flex items-center gap-2 rounded-md border border-white/40 px-5 py-3 text-sm font-bold uppercase text-white transition hover:bg-white/10">
                    Yêu cầu báo giá
                  </Link>
                </div>
              </div>
              <div className="relative hidden h-[300px] md:block">
                {heroImages.map((image, index) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={image.url}
                    src={image.url}
                    alt={image.alt}
                    className={`absolute rounded-xl bg-white object-contain p-3 shadow-[0_20px_40px_rgba(0,0,0,.35)] ${["right-2 top-0 h-48 w-48", "left-0 top-20 h-40 w-40 -rotate-3", "bottom-0 right-16 h-36 w-36 rotate-3"][index]}`}
                  />
                ))}
              </div>
            </div>
          </section>

          <aside className="hidden flex-col gap-4 xl:flex">
            <div className="flex flex-1 flex-col justify-between rounded-lg bg-white p-5 shadow-sm ring-1 ring-[#dce5f1]">
              <div>
                <Headphones className="h-8 w-8 text-gold" />
                <h2 className="mt-3 text-sm font-bold uppercase text-brand">Tư vấn & báo giá</h2>
                <p className="mt-1.5 text-[13px] leading-5 text-[#667085]">Kỹ sư tư vấn chọn đúng dụng cụ, báo giá dự án nhanh trong ngày.</p>
              </div>
              <a href={`tel:${hotline.replace(/[^\d+]/g, "")}`} className="mt-4 block rounded-md bg-brand px-3 py-2.5 text-center text-lg font-bold text-white hover:bg-brand-dark">
                {hotline}
              </a>
            </div>
            <Link href="/khuyen-mai" className="group flex flex-1 flex-col justify-between rounded-lg bg-gradient-to-br from-gold to-gold-dark p-5 text-brand-dark shadow-sm">
              <BadgePercent className="h-8 w-8" />
              <div>
                <h2 className="text-sm font-bold uppercase">Khuyến mãi tháng này</h2>
                <p className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold group-hover:underline">Xem ưu đãi <ArrowRight className="h-3.5 w-3.5" /></p>
              </div>
            </Link>
          </aside>
        </div>

        {/* Cam kết */}
        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-[#dce5f1] shadow-sm lg:grid-cols-4">
          {[
            { icon: Truck, title: "Giao hàng toàn quốc", desc: "Nhanh chóng, đóng gói cẩn thận" },
            { icon: Wallet, title: "Thanh toán tiện lợi", desc: "COD, VNPay, chuyển khoản" },
            { icon: ShieldCheck, title: "Bảo hành chính hãng", desc: "Đầy đủ CO/CQ, hóa đơn VAT" },
            { icon: Gift, title: "Ưu đãi khách sỉ", desc: "Giá tốt cho đại lý, dự án" },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3 bg-white px-4 py-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand"><item.icon className="h-5 w-5" /></span>
              <div className="min-w-0">
                <h3 className="text-[13px] font-bold text-brand">{item.title}</h3>
                <p className="truncate text-xs text-[#667085]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-3 pt-8 sm:px-4">
        {featuredCategories.length > 0 && (
          <Section title="Danh mục nổi bật" href="/san-pham">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {featuredCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/danh-muc/${category.slug}`}
                  className="group flex flex-col items-center rounded-lg border border-[#e4e9f2] bg-white p-3 text-center transition hover:border-gold hover:shadow-md"
                >
                  <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-md bg-brand-50/60">
                    {category.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={category.imageUrl} alt={category.name} loading="lazy" className="h-full w-full object-contain p-2 transition group-hover:scale-105" />
                    ) : (
                      <span className="text-2xl font-bold text-brand/30">{category.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="mt-2.5 line-clamp-2 text-xs font-bold uppercase leading-4 text-brand group-hover:text-gold-dark">{category.name}</span>
                  {category.count > 0 && <span className="mt-1 text-[11px] text-[#667085]">{category.count} sản phẩm</span>}
                </Link>
              ))}
            </div>
          </Section>
        )}

        {highlight.length > 0 && (
          <Section title="Sản phẩm nổi bật" href="/san-pham" icon={<Star className="h-5 w-5" />}>
            <ProductGrid products={highlight} />
          </Section>
        )}

        {onSale.length > 0 && (
          <Section title="Khuyến mãi" href="/khuyen-mai" icon={<BadgePercent className="h-5 w-5" />}>
            <ProductGrid products={onSale} />
          </Section>
        )}

        {/* Yêu cầu giá khuyến mãi */}
        <section className="relative overflow-hidden rounded-lg bg-brand px-5 py-7 text-white sm:px-10">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold/15" />
          <div className="absolute -bottom-20 right-40 h-48 w-48 rounded-full bg-white/5" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="flex items-center gap-2 text-xl font-bold uppercase text-gold"><FileText className="h-6 w-6" /> Yêu cầu giá khuyến mãi</h2>
              <p className="mt-2 text-sm leading-6 text-white/85">
                Gửi danh sách mã sản phẩm hoặc nhu cầu của bạn — chúng tôi phản hồi báo giá tốt nhất qua email, Zalo hoặc điện thoại trong giờ làm việc.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/lien-he" className="inline-flex items-center gap-2 rounded-md bg-gold px-5 py-3 text-sm font-bold uppercase text-brand-dark hover:bg-gold-dark">
                Gửi yêu cầu <ArrowRight className="h-4 w-4" />
              </Link>
              {settings.contact_zalo && (
                <a href={settings.contact_zalo} target="_blank" rel="noopener" className="inline-flex items-center rounded-md border border-white/40 px-5 py-3 text-sm font-bold uppercase hover:bg-white/10">
                  Chat Zalo
                </a>
              )}
            </div>
          </div>
        </section>

        {newest.length > 0 && (
          <Section title="Dòng sản phẩm mới" href="/san-pham?sort=newest" icon={<Sparkles className="h-5 w-5" />}>
            <ProductGrid products={newest} />
          </Section>
        )}

        {brands.length > 0 && (
          <Section title="Thương hiệu phân phối" href="/san-pham">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/san-pham?brand=${brand.id}`}
                  className="grid h-20 place-items-center rounded-lg border border-[#e4e9f2] bg-white px-3 transition hover:border-gold hover:shadow-md"
                  title={brand.name}
                >
                  {brand.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={brand.logoUrl} alt={brand.name} loading="lazy" className="max-h-12 max-w-full object-contain grayscale transition hover:grayscale-0" />
                  ) : (
                    <span className="text-center text-sm font-bold uppercase tracking-wide text-brand">{brand.name}</span>
                  )}
                </Link>
              ))}
            </div>
          </Section>
        )}

        {videos.length > 0 && (
          <Section title="Video / Hướng dẫn" href={settings.social_youtube || "/tin-tuc"} icon={<PlayCircle className="h-5 w-5" />}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {videos.map((id) => (
                <div key={id} className="aspect-video overflow-hidden rounded-lg bg-black">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${id}`}
                    title="Video hướng dẫn"
                    loading="lazy"
                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              ))}
            </div>
          </Section>
        )}

        {posts.length > 0 && (
          <Section title="Tin tức & chia sẻ kỹ thuật" href="/tin-tuc">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {posts.map((post) => (
                <Link key={post.id} href={`/tin-tuc/${post.slug}`} className="group overflow-hidden rounded-lg border border-[#e4e9f2] bg-white transition hover:shadow-md">
                  <div className="aspect-[16/10] overflow-hidden bg-brand-50">
                    {post.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.coverImage} alt={post.title} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                    )}
                  </div>
                  <div className="p-3.5">
                    {post.publishedAt && <p className="text-[11px] text-[#98a2b3]">{formatDate(post.publishedAt)}</p>}
                    <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-[#1d2939] group-hover:text-brand">{post.title}</h3>
                    {post.excerpt && <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[#667085]">{post.excerpt}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, href, icon, children }: { title: string; href: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="min-w-0">
      <div className="mb-4 flex items-end justify-between gap-3 border-b-2 border-[#dce5f1]">
        <h2 className="-mb-0.5 flex items-center gap-2 border-b-2 border-gold pb-2 text-base font-bold uppercase text-brand sm:text-lg">
          {icon && <span className="text-gold">{icon}</span>}
          {title}
        </h2>
        <Link href={href} className="mb-2 inline-flex shrink-0 items-center gap-1 text-xs font-bold text-brand hover:text-gold-dark">
          Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {children}
    </section>
  );
}

function ProductGrid({ products }: { products: Parameters<typeof ProductCard>[0]["product"][] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
