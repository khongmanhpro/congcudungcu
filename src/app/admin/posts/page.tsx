import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, FileText, Plus, SearchCheck } from "lucide-react";
import { DeleteButton } from "../_components/delete-button";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page || "1");
  const pageSize = 20;
  const search = sp.search;
  const status = sp.status;

  const where: Record<string, unknown> = {};
  if (search) where.title = { contains: search, mode: "insensitive" };
  if (status) where.status = status;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: { category: true, author: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.post.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  const statusVariant: Record<string, "default" | "secondary" | "success" | "warning"> = {
    PUBLISHED: "success",
    DRAFT: "secondary",
    ARCHIVED: "warning",
  };
  const seoReady = (post: (typeof posts)[number]) => Boolean(post.seoTitle && post.seoDesc && post.coverImage);
  const seoIssues = posts.filter((post) => !seoReady(post)).length;

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-[#d8e0ec] bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.14em] text-[#0757c9]">Content SEO</div>
            <h1 className="mt-2 text-3xl font-black text-[#172033]">Bài viết</h1>
            <p className="mt-1 text-sm text-[#667085]">{total} bài viết, {seoIssues} bài cần bổ sung SEO trên trang này</p>
          </div>
          <Button asChild className="bg-[#0757c9] font-black hover:bg-[#0048a8]">
            <Link href="/admin/posts/new">
              <Plus className="h-4 w-4" /> Viết bài mới
            </Link>
          </Button>
        </div>
      </div>

      <form className="flex flex-col gap-2 rounded-md border border-[#d8e0ec] bg-white p-3 sm:flex-row" method="get">
        <input
          name="search"
          defaultValue={search}
          placeholder="Tìm theo tiêu đề..."
          className="h-10 flex-1 rounded-md border border-[#d8e0ec] bg-white px-3 text-sm outline-none focus:border-[#0757c9]"
        />
        <select name="status" defaultValue={status || ""} className="h-10 rounded-md border border-[#d8e0ec] bg-white px-3 text-sm outline-none focus:border-[#0757c9]">
          <option value="">Tất cả trạng thái</option>
          <option value="PUBLISHED">Đã đăng</option>
          <option value="DRAFT">Bản nháp</option>
          <option value="ARCHIVED">Lưu trữ</option>
        </select>
        <Button type="submit" variant="outline" className="font-bold">Lọc</Button>
      </form>

      <div className="overflow-hidden rounded-md border border-[#d8e0ec] bg-white">
        <Table>
          <TableHeader className="bg-[#f7faff]">
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>SEO</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  Chưa có bài viết nào.
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <Link href={`/admin/posts/${post.id}/edit`} className="font-bold text-[#172033] hover:text-[#0757c9]">
                      {post.title}
                    </Link>
                    <div className="text-xs text-[#667085]">/{post.slug}</div>
                  </TableCell>
                  <TableCell>{post.category?.name || "—"}</TableCell>
                  <TableCell>
                    {seoReady(post) ? (
                      <span className="inline-flex items-center gap-1 rounded bg-[#ecfdf3] px-2 py-1 text-xs font-black text-[#16a34a]">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Đủ SEO
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-[#fff7ed] px-2 py-1 text-xs font-black text-[#f97316]">
                        <SearchCheck className="h-3.5 w-3.5" /> Cần bổ sung
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[post.status] || "default"}>{post.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[#667085]">{formatDate(post.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" variant="outline" className="font-bold">
                        <Link href={`/admin/posts/${post.id}/edit`}>Sửa</Link>
                      </Button>
                      <DeleteButton endpoint={`/api/posts/${post.id}`} label="bài viết" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/posts?page=${p}${search ? `&search=${search}` : ""}${status ? `&status=${status}` : ""}`}
              className={`rounded-md px-3 py-1 text-sm ${p === page ? "bg-primary text-white" : "border hover:bg-neutral-50"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
