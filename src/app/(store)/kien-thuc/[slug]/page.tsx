import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { JsonLd, SITE_NAME, absoluteUrl, breadcrumbJsonLd, getSiteUrl, toMetaDescription } from "@/lib/seo";
import type { Metadata } from "next";
import { redirectIfMoved } from "@/lib/redirects";
import { autolinkHtml, getCategoryLinkTerms } from "@/lib/autolink";
import { getCategorySubtreeIds } from "@/lib/categories";
import { getProductStats } from "@/lib/product-stats";
import { categoryPath, postPath } from "@/lib/urls";
import { ProductCard } from "@/components/store/product-card";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post || post.status !== "PUBLISHED") return { title: "Không tìm thấy bài viết", robots: { index: false, follow: true } };
  const title = post.seoTitle || post.title;
  const description = toMetaDescription(post.seoDesc) || toMetaDescription(post.excerpt) || toMetaDescription(post.content);
  const path = `/kien-thuc/${post.slug}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: path,
      title,
      description,
      locale: "vi_VN",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: post.coverImage ? [{ url: absoluteUrl(post.coverImage), alt: post.title }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description, images: post.coverImage ? [absoluteUrl(post.coverImage)] : undefined },
  };
}

export default async function PostDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug },
    include: { author: { select: { name: true } } },
  });

  if (!post || post.status !== "PUBLISHED") {
    await redirectIfMoved(`/kien-thuc/${slug}`);
    notFound();
  }

  const path = `/kien-thuc/${post.slug}`;
  const terms = await getCategoryLinkTerms();
  const { html: contentHtml, paths: mentionedPaths } = autolinkHtml(post.content, terms, { currentPath: path });

  // danh mục bài viết nhắc tới → khối "Danh mục liên quan" + "Sản phẩm liên quan"
  const mentionedSlugs = mentionedPaths.map((p) => p.split("/").pop()!).filter(Boolean);
  const [relatedPosts, mentionedCategories] = await Promise.all([
    prisma.post.findMany({
      where: { status: "PUBLISHED", id: { not: post.id } },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: { id: true, slug: true, title: true, excerpt: true },
    }),
    prisma.category.findMany({
      where: { slug: { in: mentionedSlugs }, type: "PRODUCT" },
      select: { id: true, name: true, slug: true, parent: { select: { slug: true } } },
    }),
  ]);
  const orderedCategories = mentionedSlugs.map((s) => mentionedCategories.find((c) => c.slug === s)).filter((c): c is (typeof mentionedCategories)[number] => !!c);
  const categoryIds = (await Promise.all(orderedCategories.slice(0, 4).map((c) => getCategorySubtreeIds(c.id)))).flat();
  const relatedProducts = categoryIds.length
    ? await prisma.product.findMany({
        where: { status: "PUBLISHED", categoryId: { in: categoryIds }, images: { some: {} } },
        include: { images: { take: 1, orderBy: { position: "asc" } }, brand: { select: { name: true } } },
        orderBy: [{ featured: "desc" }, { price: "desc" }, { id: "asc" }],
        take: 6,
      })
    : [];
  const stats = await getProductStats(relatedProducts.map((p) => p.id));

  const postUrl = absoluteUrl(`/kien-thuc/${post.slug}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${postUrl}#article`,
    mainEntityOfPage: postUrl,
    headline: post.title.slice(0, 110),
    description: toMetaDescription(post.seoDesc) || toMetaDescription(post.excerpt) || toMetaDescription(post.content),
    image: post.coverImage ? [absoluteUrl(post.coverImage)] : undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    inLanguage: "vi-VN",
    // không lộ email tác giả ra ngoài
    author: post.author?.name ? { "@type": "Person", name: post.author.name } : { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", "@id": `${getSiteUrl()}/#organization`, name: SITE_NAME },
  };
  const breadcrumb = breadcrumbJsonLd([
    { name: "Trang chủ", path: "/" },
    { name: "Kiến thức", path: "/kien-thuc" },
    { name: post.title, path: `/kien-thuc/${post.slug}` },
  ]);

  return (
    <div className="bg-[#f5f6f8] pb-8">
      <JsonLd data={[jsonLd, breadcrumb]} />
      <div className="mx-auto max-w-7xl space-y-4 px-3 pt-3 sm:px-4">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[13px] text-[#475569]">
          <Link href="/" className="hover:text-brand">Trang chủ</Link> /
          <Link href="/kien-thuc" className="hover:text-brand">Kiến thức</Link> /
          <span className="font-bold text-[#0f172a]">{post.title}</span>
        </nav>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <article className="rounded-lg border border-gold bg-white p-4 sm:p-6">
            <p className="text-xs text-[#64748b]">
              {post.publishedAt && formatDate(post.publishedAt)}
              {post.author?.name && ` · ${post.author.name}`}
            </p>
            <h1 className="mt-1 text-2xl font-black leading-tight text-[#0f172a] sm:text-3xl">{post.title}</h1>
            {post.excerpt && <p className="mt-3 text-base leading-7 text-[#334155]">{post.excerpt}</p>}
            {post.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              // khung cao cố định → không đẩy nội dung khi ảnh tải xong (CLS)
              <div className="mt-4 h-64 w-full sm:h-72">
                <img src={post.coverImage} alt={post.title} fetchPriority="high" className="h-full w-full rounded-md bg-white object-contain" />
              </div>
            )}
            <div className="rich-content mt-5 max-w-none" dangerouslySetInnerHTML={{ __html: contentHtml }} />
          </article>

          <aside className="space-y-4">
            {orderedCategories.length > 0 && (
              <section className="rounded-lg border border-gold bg-white p-4">
                <h2 className="mb-3 text-base font-black text-[#0f172a]">Danh mục liên quan</h2>
                <div className="flex flex-wrap gap-2">
                  {orderedCategories.map((c) => (
                    <Link key={c.id} href={categoryPath(c)} className="rounded-full border border-gold px-3 py-1.5 text-[13px] font-bold text-[#0f172a] hover:bg-gold hover:text-brand-dark">
                      {c.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {relatedPosts.length > 0 && (
              <section className="rounded-lg border border-gold bg-white p-4">
                <h2 className="mb-3 text-base font-black text-[#0f172a]">Bài viết khác</h2>
                <ul className="space-y-3">
                  {relatedPosts.map((r) => (
                    <li key={r.id}>
                      <Link href={postPath(r.slug)} className="text-sm font-bold text-[#0f172a] hover:text-brand">{r.title}</Link>
                      {r.excerpt && <p className="mt-0.5 line-clamp-2 text-xs text-[#64748b]">{r.excerpt}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section className="rounded-lg bg-brand p-4 text-white">
              <h2 className="text-base font-black text-gold">Cần tư vấn chọn dụng cụ?</h2>
              <p className="mt-1 text-sm text-white/85">Gửi nhu cầu để nhận báo giá nhanh, hóa đơn VAT, giao hàng toàn quốc.</p>
              <Link href="/lien-he" className="mt-3 inline-flex rounded-md bg-gold px-4 py-2 text-sm font-bold text-brand-dark hover:bg-gold-dark">Yêu cầu báo giá</Link>
            </section>
          </aside>
        </div>

        {relatedProducts.length > 0 && (
          <section className="rounded-lg border border-gold bg-white p-3">
            <h2 className="mb-3 text-xl font-black text-[#0f172a]">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} stats={stats.get(product.id)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
