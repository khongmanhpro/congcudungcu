import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post) return { title: "Không tìm thấy bài viết" };
  return {
    title: post.seoTitle || post.title,
    description: post.seoDesc || post.excerpt || undefined,
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.coverImage || undefined,
    datePublished: post.publishedAt?.toISOString(),
    author: post.author ? { "@type": "Person", name: post.author.name || post.author.email } : undefined,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Trang chủ</Link> / <Link href="/tin-tuc" className="hover:text-primary">Tin tức</Link> / <span>{post.title}</span>
      </nav>

      <article>
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          {post.category && <Link href={`/tin-tuc?cat=${post.category.slug}`} className="rounded bg-neutral-100 px-2 py-0.5 hover:bg-neutral-200">{post.category.name}</Link>}
          {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
          {post.author && <span>· {post.author.name || post.author.email}</span>}
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
