"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";

interface CatItem {
  id: string;
  name: string;
  slug: string;
  type: string;
  parentId: string | null;
  parentName: string | null;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
  postCount: number;
  childrenCount: number;
  seoTitle: string | null;
  seoDesc: string | null;
  intro: string | null;
  content: string | null;
  faq: { question: string; answer: string }[];
  position: number;
  featured: boolean;
}

export function CategoriesManager({ initialCategories }: { initialCategories: CatItem[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CatItem | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("PRODUCT");
  const [parentId, setParentId] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [intro, setIntro] = useState("");
  const [content, setContent] = useState("");
  const [faq, setFaq] = useState<{ question: string; answer: string }[]>([]);
  const [position, setPosition] = useState("0");
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setEditing(null);
    setName("");
    setType("PRODUCT");
    setParentId("");
    setDescription("");
    setImageUrl("");
    setSeoTitle("");
    setSeoDesc("");
    setIntro("");
    setContent("");
    setFaq([]);
    setPosition("0");
  }

  function startEdit(c: CatItem) {
    setEditing(c);
    setName(c.name);
    setType(c.type);
    setParentId(c.parentId || "");
    setDescription(c.description || "");
    setImageUrl(c.imageUrl || "");
    setSeoTitle(c.seoTitle || "");
    setSeoDesc(c.seoDesc || "");
    setIntro(c.intro || "");
    setContent(c.content || "");
    setFaq(c.faq);
    setPosition(String(c.position));
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name,
      type,
      parentId: parentId || null,
      description: description || null,
      imageUrl: imageUrl || null,
      seoTitle: seoTitle || null,
      seoDesc: seoDesc || null,
      intro: intro || null,
      content: content || null,
      faq: faq.filter((f) => f.question.trim() && f.answer.trim()),
      position: Number(position) || 0,
    };
    try {
      const url = editing ? `/api/categories/${editing.id}` : "/api/categories";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowForm(false);
        resetForm();
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Lỗi lưu danh mục");
      }
    } catch {
      alert("Lỗi mạng");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa danh mục? Sản phẩm/bài viết sẽ mất danh mục.")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else {
      const data = await res.json().catch(() => null);
      alert(data?.error || "Xóa thất bại (có thể do còn danh mục con)");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4" /> Thêm danh mục
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editing ? "Sửa danh mục" : "Danh mục mới"}</h3>
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Tên *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Loại</Label>
              <select id="type" value={type} onChange={(e) => setType(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="PRODUCT">Sản phẩm</option>
                <option value="POST">Bài viết</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentId">Danh mục cha</Label>
              <select id="parentId" value={parentId} onChange={(e) => setParentId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">— Không (cấp gốc) —</option>
                {categories.filter((c) => c.type === type && c.id !== editing?.id).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL ảnh</Label>
              <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {type === "PRODUCT" && (
            <div className="space-y-4 rounded-md border border-dashed p-4">
              <p className="text-sm font-semibold">SEO &amp; nội dung trang danh mục</p>
              <div className="grid gap-4 md:grid-cols-[1fr_1fr_120px]">
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">Tiêu đề SEO <span className="text-xs text-muted-foreground">({seoTitle.length}/60)</span></Label>
                  <Input id="seoTitle" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder={`Mặc định: ${name || "Tên"} chính hãng, giá tốt`} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoDesc">Mô tả SEO <span className="text-xs text-muted-foreground">({seoDesc.length}/155)</span></Label>
                  <Input id="seoDesc" value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Thứ tự</Label>
                  <Input id="position" type="number" value={position} onChange={(e) => setPosition(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="intro">Giới thiệu ngắn (hiển thị trên lưới sản phẩm, 2–3 câu)</Label>
                <Textarea id="intro" rows={2} value={intro} onChange={(e) => setIntro(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Nội dung hướng dẫn (HTML, hiển thị dưới lưới: cách chọn, phân loại, bảng size…)</Label>
                <Textarea id="content" rows={8} className="font-mono text-xs" value={content} onChange={(e) => setContent(e.target.value)} placeholder="<h2>Cách chọn …</h2><p>…</p>" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Câu hỏi thường gặp</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setFaq([...faq, { question: "", answer: "" }])}>
                    <Plus className="h-4 w-4" /> Thêm câu hỏi
                  </Button>
                </div>
                {faq.map((item, i) => (
                  <div key={i} className="space-y-1.5 rounded-md border p-2">
                    <div className="flex gap-2">
                      <Input value={item.question} onChange={(e) => setFaq(faq.map((f, idx) => (idx === i ? { ...f, question: e.target.value } : f)))} placeholder="Câu hỏi" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => setFaq(faq.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                    </div>
                    <Textarea rows={2} value={item.answer} onChange={(e) => setFaq(faq.map((f, idx) => (idx === i ? { ...f, answer: e.target.value } : f)))} placeholder="Trả lời" />
                  </div>
                ))}
              </div>
            </div>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo"}
          </Button>
        </form>
      )}

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Danh mục cha</TableHead>
              <TableHead>Số lượng</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">/{c.slug}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={c.type === "PRODUCT" ? "default" : "secondary"}>
                    {c.type === "PRODUCT" ? "Sản phẩm" : "Bài viết"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{c.parentName || "—"}</TableCell>
                <TableCell className="text-sm">
                  {c.type === "PRODUCT" ? `${c.productCount} SP` : `${c.postCount} bài`}
                  {c.childrenCount > 0 && ` · ${c.childrenCount} con`}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="icon" variant="outline" onClick={() => startEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
