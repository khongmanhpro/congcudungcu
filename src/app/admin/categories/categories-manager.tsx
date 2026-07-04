"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setEditing(null);
    setName("");
    setType("PRODUCT");
    setParentId("");
    setDescription("");
    setImageUrl("");
  }

  function startEdit(c: CatItem) {
    setEditing(c);
    setName(c.name);
    setType(c.type);
    setParentId(c.parentId || "");
    setDescription(c.description || "");
    setImageUrl(c.imageUrl || "");
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
