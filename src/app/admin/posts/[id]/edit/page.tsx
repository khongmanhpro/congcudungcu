import { prisma } from "@/lib/prisma";
import { PostEditor } from "@/components/admin/post-editor";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, categories] = await Promise.all([
    prisma.post.findUnique({
      where: { id },
      include: { tags: true },
    }),
    prisma.category.findMany({ where: { type: "POST" }, orderBy: { name: "asc" } }),
  ]);

  if (!post) notFound();

  const postSerializable = {
    ...post,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/posts" className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ChevronLeft className="h-4 w-4" /> Quay lại danh sách
        </Link>
        <h1 className="text-2xl font-bold">Sửa bài viết</h1>
        <p className="text-sm text-muted-foreground">{post.title}</p>
      </div>
      <PostEditor post={postSerializable} categories={categories} />
    </div>
  );
}
