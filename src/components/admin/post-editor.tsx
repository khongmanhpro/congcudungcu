"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
import { slugify } from "@/lib/slug";

interface Category {
  id: string;
  name: string;
}

interface PostData {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  categoryId: string | null;
  status: string;
  seoTitle: string | null;
  seoDesc: string | null;
  publishedAt: string | null;
  tags: { id: string; name: string }[];
}

export function PostEditor({ post, categories }: { post: PostData | null; categories: Category[] }) {
  const router = useRouter();
  const isEdit = !!post;

  const [title, setTitle] = useState(post?.title || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [content, setContent] = useState(post?.content || "");
  const [coverImage, setCoverImage] = useState(post?.coverImage || "");
  const [categoryId, setCategoryId] = useState(post?.categoryId || "");
  const [status, setStatus] = useState(post?.status || "DRAFT");
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle || "");
  const [seoDesc, setSeoDesc] = useState(post?.seoDesc || "");
  const [publishedAt, setPublishedAt] = useState(
    post?.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 16) : "",
  );
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      coverImage: coverImage || null,
      categoryId: categoryId || null,
      status,
      seoTitle: seoTitle || null,
      seoDesc: seoDesc || null,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
    };

    try {
      const url = isEdit ? `/api/posts/${post!.id}` : "/api/posts";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(JSON.stringify(data.error) || "Lỗi lưu bài viết");
        setSaving(false);
        return;
      }
      router.push("/admin/posts");
      router.refresh();
    } catch {
      setError("Lỗi mạng");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                const nextTitle = e.target.value;
                setTitle(nextTitle);
                if (!slugTouched) setSlug(slugify(nextTitle));
              }}
              required
              placeholder="Tiêu đề bài viết"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              placeholder="tu-dong-sinh-tu-tieu-de"
            />
            <p className="text-xs text-muted-foreground">URL: /tin-tuc/{slug || "..."}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="excerpt">Tóm tắt</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              placeholder="Đoạn tóm tắt ngắn..."
            />
          </div>
          <div className="space-y-2">
            <Label>Nội dung</Label>
            <TiptapEditor value={content} onChange={setContent} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border bg-white p-4 space-y-4">
            <h3 className="font-semibold">Đăng bài</h3>
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="DRAFT">Bản nháp</option>
                <option value="PUBLISHED">Đã đăng</option>
                <option value="ARCHIVED">Lưu trữ</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="publishedAt">Ngày đăng</Label>
              <Input
                id="publishedAt"
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo bài viết"}
            </Button>
          </div>

          <div className="rounded-lg border bg-white p-4 space-y-4">
            <h3 className="font-semibold">Phân loại</h3>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Danh mục</Label>
              <select
                id="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">— Chọn —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 space-y-4">
            <h3 className="font-semibold">Ảnh bìa</h3>
            <Input
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="URL ảnh bìa"
            />
            {coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverImage} alt="cover" className="h-32 w-full rounded-md object-cover" />
            )}
          </div>

          <div className="rounded-lg border bg-white p-4 space-y-4">
            <h3 className="font-semibold">SEO</h3>
            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO Title</Label>
              <Input id="seoTitle" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoDesc">SEO Description</Label>
              <Textarea id="seoDesc" value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={3} />
            </div>
          </div>
        </div>
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    </form>
  );
}
