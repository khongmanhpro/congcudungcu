import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { JsonLd, SITE_NAME, absoluteUrl, breadcrumbJsonLd, getSiteUrl, toMetaDescription } from "@/lib/seo";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post || post.status !== "PUBLISHED") return { title: "Không tìm thấy bài viết", robots: { index: false, follow: true } };
  const title = post.seoTitle || post.title;
  const description = toMetaDescription(post.seoDesc) || toMetaDescription(post.excerpt) || toMetaDescription(post.content);
  const path = `/tin-tuc/${post.slug}`;
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
    include: { category: true, author: true, tags: true },
  });

  if (!post || post.status !== "PUBLISHED") notFound();

  const related = await prisma.post.findMany({
    where: { status: "PUBLISHED", categoryId: post.categoryId, id: { not: post.id } },
    take: 3,
  });

  const postUrl = absoluteUrl(`/tin-tuc/${post.slug}`);
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
    { name: "Tin tức", path: "/tin-tuc" },
    { name: post.title, path: `/tin-tuc/${post.slug}` },
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <JsonLd data={[jsonLd, breadcrumb]} />

      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Trang chủ</Link> / <Link href="/tin-tuc" className="hover:text-primary">Tin tức</Link> / <span>{post.title}</span>
      </nav>

      <article>
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          {post.category && <Link href={`/tin-tuc?cat=${post.category.slug}`} className="rounded bg-neutral-100 px-2 py-0.5 hover:bg-neutral-200">{post.category.name}</Link>}
          {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
          {post.author?.name && <span>· {post.author.name}</span>}
        </div>

        <h1 className="mb-4 text-3xl font-bold">{post.title}</h1>

        {post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImage} alt={post.title} className="mb-6 aspect-video w-full rounded-lg object-cover" />
        )}

        {post.excerpt && <p className="mb-6 text-lg text-muted-foreground">{post.excerpt}</p>}

        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />

        {post.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <span key={t.id} className="rounded-full bg-neutral-100 px-3 py-1 text-xs">#{t.name}</span>
            ))}
          </div>
        )}
      </article>

      {related.length > 0 && (
        <section className="mt-10 border-t pt-6">
          <h2 className="mb-4 text-xl font-bold">Bài viết liên quan</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {related.map((r) => (
              <Link key={r.id} href={`/tin-tuc/${r.slug}`} className="group rounded-lg border bg-white p-4 hover:shadow-md">
                <h3 className="text-sm font-medium group-hover:text-primary">{r.title}</h3>
                {r.excerpt && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.excerpt}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
