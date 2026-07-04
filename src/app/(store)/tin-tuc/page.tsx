import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatNumber } from "@/lib/format";
import { NewsletterForm } from "@/components/store/newsletter-form";
import {
  ArrowRight,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Factory,
  Headphones,
  Lightbulb,
  Mail,
  Newspaper,
  Sparkles,
  Wrench,
} from "lucide-react";

export const revalidate = 60;

const PAGE_SIZE = 9;

const topicFilters = [
  { label: "Tin công ty", value: "cong-ty", icon: BriefcaseBusiness, keywords: ["công ty", "workman", "nhà phân phối", "đại lý", "wokin"] },
  { label: "Kiến thức nghề nghiệp", value: "kien-thuc", icon: Factory, keywords: ["quy trình", "bảo trì", "thiết bị", "cơ khí", "công nghiệp"] },
  { label: "Hướng dẫn sử dụng", value: "huong-dan", icon: BookOpenCheck, keywords: ["hướng dẫn", "cách sử dụng", "sử dụng", "bảo quản"] },
  { label: "Kinh nghiệm chọn mua", value: "kinh-nghiem", icon: Lightbulb, keywords: ["chọn", "mua", "top", "bảng giá", "so sánh"] },
  { label: "Xu hướng công nghệ", value: "cong-nghe", icon: Sparkles, keywords: ["công nghệ", "pin", "bosch", "knipex", "catalog"] },
  { label: "Sự kiện - Triển lãm", value: "su-kien", icon: CalendarDays, keywords: ["triển lãm", "show", "sự kiện", "catalog"] },
];

const fallbackImages = [
  "/uploads/2026/05/bosch-scaled-1000x574.jpg",
  "/uploads/2021/12/Cac-Loi-Thuong-Gap-o-May-Khoan-dong-Luc-400x400.jpg",
  "/uploads/2026/06/bua-cao-su-wokin-251608-251632.jpg",
  "/uploads/2021/12/May-Han-Que-Ban-Chay-Nhat-Binh-Duong-400x400.jpg",
  "/uploads/2026/06/pa-lang-cap-dien-wokin-738012-738002.jpg",
  "/uploads/2026/06/palang-xich-keo-tay-wokin-738101-738105.jpg",
  "/uploads/2026/05/gang-tay-da-bao-ho-wokin-451410-510x510.webp",
  "/uploads/2026/03/Wokin-157543-wmjsc-510x510.webp",
  "/uploads/2026/05/bosch.jpg",
];

type BlogSearchParams = {
  page?: string;
  sort?: string;
  topic?: string;
};

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  publishedAt: Date | null;
  createdAt: Date;
};

function cleanText(value: string | null | undefined) {
  return (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getExcerpt(post: BlogPost) {
  return post.excerpt || cleanText(post.content).slice(0, 150) || "Cập nhật thông tin kỹ thuật, kinh nghiệm chọn mua và sử dụng thiết bị công nghiệp chính hãng.";
}

function getPostImage(post: BlogPost, index: number) {
  if (post.coverImage) return post.coverImage;
  const title = post.title.toLowerCase();
  if (title.includes("bảo hộ") || title.includes("găng tay")) return "/uploads/2026/05/gang-tay-da-bao-ho-wokin-451410-510x510.webp";
  if (title.includes("hàn")) return "/uploads/2021/12/May-Han-Que-Ban-Chay-Nhat-Binh-Duong-400x400.jpg";
  if (title.includes("khoan") || title.includes("pin")) return "/uploads/2021/12/Cac-Loi-Thuong-Gap-o-May-Khoan-dong-Luc-400x400.jpg";
  if (title.includes("bosch")) return "/uploads/2026/05/bosch-scaled-1000x574.jpg";
  if (title.includes("thước") || title.includes("đo")) return "/uploads/2026/06/palang-xich-keo-tay-wokin-738101-738105.jpg";
  return fallbackImages[index % fallbackImages.length];
}

function matchesTopic(post: BlogPost, topic?: string) {
  if (!topic) return true;
  const filter = topicFilters.find((item) => item.value === topic);
  if (!filter) return true;
  const haystack = `${post.title} ${post.excerpt || ""} ${cleanText(post.content).slice(0, 500)}`.toLowerCase();
  return filter.keywords.some((keyword) => haystack.includes(keyword));
}

function pageHref(page: number, sort: string, topic?: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (sort !== "newest") params.set("sort", sort);
  if (topic) params.set("topic", topic);
  const query = params.toString();
  return query ? `/tin-tuc?${query}` : "/tin-tuc";
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<BlogSearchParams> }) {
  const params = await searchParams;
  const currentPage = Math.max(1, Number(params.page || "1") || 1);
  const sort = params.sort === "oldest" ? "oldest" : "newest";
  const currentTopic = topicFilters.some((item) => item.value === params.topic) ? params.topic : undefined;

  const allPosts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: sort === "oldest" ? "asc" : "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      coverImage: true,
      publishedAt: true,
      createdAt: true,
    },
  }).catch(() => []);

  const filteredPosts = allPosts.filter((post) => matchesTopic(post, currentTopic));
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const posts = filteredPosts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const featuredPosts = allPosts.slice(0, 4);

  return (
    <div className="bg-[#f4f7fb] text-[#172033]">
      <section className="relative overflow-hidden bg-[#063f96] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#063f96_0%,rgba(6,63,150,.92)_42%,rgba(6,63,150,.28)_72%,rgba(6,63,150,.1)_100%)]" />
        <div className="absolute inset-y-0 right-0 w-[58%] bg-[url('/uploads/2026/05/bosch-scaled-1000x574.jpg')] bg-cover bg-center opacity-45 grayscale" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:44px_44px] opacity-35" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:py-16">
          <nav className="mb-6 flex items-center gap-2 text-sm text-white/85">
            <Link href="/" className="hover:text-white">Trang chủ</Link>
            <ChevronRight className="h-4 w-4" />
            <span>Tin tức</span>
          </nav>
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-[#9fd3ff]">Bản tin công nghiệp</p>
            <h1 className="text-4xl font-black uppercase leading-tight sm:text-5xl">Tin tức</h1>
            <p className="mt-4 max-w-xl text-base font-medium leading-7 text-white/88">
              Cập nhật thông tin, kiến thức và xu hướng mới nhất về ngành công cụ dụng cụ, thiết bị công nghiệp chính hãng.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-7 lg:grid-cols-[270px_minmax(0,1fr)] lg:py-9">
        <aside className="space-y-6">
          <section className="overflow-hidden rounded-md border border-[#dce5f1] bg-white shadow-sm">
            <div className="flex items-center gap-2 bg-[#0757c9] px-4 py-3 text-sm font-black uppercase text-white">
              <Newspaper className="h-4 w-4" />
              Danh mục tin tức
            </div>
            <div className="divide-y divide-[#edf1f7]">
              {topicFilters.map((topic) => {
                const Icon = topic.icon;
                const active = currentTopic === topic.value;
                return (
                  <Link
                    key={topic.value}
                    href={active ? "/tin-tuc" : `/tin-tuc?topic=${topic.value}`}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition hover:bg-[#f0f6ff] hover:text-[#0757c9] ${active ? "bg-[#f0f6ff] text-[#0757c9]" : "text-[#344054]"}`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-[#0757c9]" />
                    <span className="flex-1">{topic.label}</span>
                    <ChevronRight className="h-4 w-4 text-[#98a2b3]" />
                  </Link>
                );
              })}
            </div>
          </section>

          {featuredPosts.length > 0 && (
            <section className="overflow-hidden rounded-md border border-[#dce5f1] bg-white shadow-sm">
              <div className="bg-[#0757c9] px-4 py-3 text-sm font-black uppercase text-white">Bài viết nổi bật</div>
              <div className="space-y-3 p-3">
                {featuredPosts.map((post, index) => (
                  <Link key={post.id} href={`/tin-tuc/${post.slug}`} className="group grid grid-cols-[72px_1fr] gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getPostImage(post, index)} alt={post.title} className="h-16 w-full rounded object-cover" />
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-xs font-black leading-5 text-[#172033] group-hover:text-[#0757c9]">{post.title}</span>
                      <span className="mt-1 block text-xs text-[#667085]">{formatDate(post.publishedAt || post.createdAt)}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="overflow-hidden rounded-md bg-[#0649aa] text-white shadow-sm">
            <div className="relative p-5">
              <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full border border-white/20" />
              <Headphones className="h-8 w-8 text-[#9fd3ff]" />
              <h2 className="mt-4 text-xl font-black uppercase leading-snug">Cần tư vấn chọn mua dụng cụ?</h2>
              <p className="mt-3 text-sm leading-6 text-white/82">Đội ngũ chuyên gia luôn sẵn sàng hỗ trợ chọn giải pháp phù hợp.</p>
              <a href="tel:+84978390339" className="mt-5 flex h-11 items-center justify-center rounded bg-[#0757c9] text-sm font-black text-white hover:bg-[#003f9c]">
                +84 978.39.03.39
              </a>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/uploads/2026/05/bosch-scaled-1000x574.jpg" alt="Thiết bị công nghiệp" className="h-32 w-full object-cover opacity-85" />
          </section>
        </aside>

        <section className="min-w-0">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#667085]">
              Hiển thị <strong className="text-[#172033]">{posts.length}</strong> trong <strong className="text-[#172033]">{formatNumber(filteredPosts.length)}</strong> kết quả
            </p>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-medium text-[#667085]">Sắp xếp:</span>
              <Link href={pageHref(1, sort === "newest" ? "oldest" : "newest", currentTopic)} className="rounded border border-[#dce5f1] bg-white px-4 py-2 font-semibold text-[#172033] hover:border-[#0757c9] hover:text-[#0757c9]">
                {sort === "newest" ? "Mới nhất" : "Cũ nhất"}
              </Link>
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="rounded-md border border-[#dce5f1] bg-white p-8 text-center">
              <Wrench className="mx-auto h-10 w-10 text-[#0757c9]" />
              <h2 className="mt-3 text-lg font-black">Chưa có bài viết phù hợp</h2>
              <p className="mt-2 text-sm text-[#667085]">Hãy chọn danh mục khác hoặc quay lại danh sách tin tức.</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((post, index) => (
                <ArticleCard key={post.id} post={post} index={index} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2">
              <Link href={pageHref(Math.max(1, safePage - 1), sort, currentTopic)} className="grid h-10 w-10 place-items-center rounded border border-[#dce5f1] bg-white text-[#0757c9] hover:border-[#0757c9]">
                <ChevronLeft className="h-4 w-4" />
              </Link>
              {Array.from({ length: Math.min(totalPages, 6) }).map((_, index) => {
                const page = index + 1;
                return (
                  <Link key={page} href={pageHref(page, sort, currentTopic)} className={`grid h-10 w-10 place-items-center rounded text-sm font-black ${safePage === page ? "bg-[#0757c9] text-white" : "bg-white text-[#0757c9] hover:bg-[#f0f6ff]"}`}>
                    {page}
                  </Link>
                );
              })}
              {totalPages > 6 && <span className="px-2 text-[#667085]">...</span>}
              <Link href={pageHref(Math.min(totalPages, safePage + 1), sort, currentTopic)} className="grid h-10 w-10 place-items-center rounded border border-[#dce5f1] bg-white text-[#0757c9] hover:border-[#0757c9]">
                <ChevronRight className="h-4 w-4" />
              </Link>
            </nav>
          )}
        </section>
      </main>

      <section className="border-t border-[#dce5f1] bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-7 md:grid-cols-[1fr_420px] md:items-center">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded bg-[#eef5ff] text-[#0757c9]">
              <Mail className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-[#0757c9]">Đăng ký nhận tin</h2>
              <p className="text-sm text-[#667085]">Nhận thông tin sản phẩm mới, khuyến mãi và tin tức từ chúng tôi.</p>
            </div>
          </div>
          <div className="[&_form]:max-w-none [&_form]:border [&_form]:border-[#dce5f1] [&_button]:bg-[#0757c9] [&_button:hover]:bg-[#0048a8]">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </div>
  );
}

function ArticleCard({ post, index }: { post: BlogPost; index: number }) {
  return (
    <Link href={`/tin-tuc/${post.slug}`} className="group overflow-hidden rounded-md border border-[#dce5f1] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[1.55] overflow-hidden bg-[#d8e5f5]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={getPostImage(post, index)} alt={post.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        <div className="absolute left-3 top-3 rounded bg-white/92 px-2 py-1 text-xs font-black text-[#0757c9]">{formatDate(post.publishedAt || post.createdAt)}</div>
      </div>
      <div className="p-4">
        <h2 className="line-clamp-2 min-h-[48px] text-base font-black leading-6 text-[#172033] group-hover:text-[#0757c9]">{post.title}</h2>
        <p className="mt-3 line-clamp-3 min-h-[60px] text-sm leading-5 text-[#667085]">{getExcerpt(post)}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-[#0757c9]">
          Xem chi tiết <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
