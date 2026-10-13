import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { redirectIfMoved } from "@/lib/redirects";
import { categoryPath } from "@/lib/urls";

// URL cũ /danh-muc/<slug> → URL mới (bảng Redirect, hoặc theo slug danh mục hiện có)
export default async function LegacyCategoryRedirect({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  await redirectIfMoved(`/danh-muc/${slug.join("/")}`);
  const category = await prisma.category.findUnique({
    where: { slug: slug[slug.length - 1] },
    select: { slug: true, type: true, parent: { select: { slug: true } } },
  });
  if (category?.type === "PRODUCT") permanentRedirect(categoryPath(category));
  notFound();
}
