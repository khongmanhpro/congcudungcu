import { prisma } from "@/lib/prisma";
import { PostEditor } from "@/components/admin/post-editor";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const categories = await prisma.category.findMany({
    where: { type: "POST" },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/posts" className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ChevronLeft className="h-4 w-4" /> Quay lại danh sách
        </Link>
        <h1 className="text-2xl font-bold">Viết bài mới</h1>
      </div>
      <PostEditor post={null} categories={categories} />
    </div>
  );
}
