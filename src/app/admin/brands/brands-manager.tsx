"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, X } from "lucide-react";

interface BrandItem {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  country: string | null;
  productCount: number;
}

export function BrandsManager({ initialBrands }: { initialBrands: BrandItem[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BrandItem | null>(null);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [country, setCountry] = useState("");
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setEditing(null);
    setName("");
    setLogoUrl("");
    setCountry("");
  }

  function startEdit(b: BrandItem) {
    setEditing(b);
    setName(b.name);
    setLogoUrl(b.logoUrl || "");
    setCountry(b.country || "");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { name, logoUrl: logoUrl || null, country: country || null };
    try {
      const url = editing ? `/api/brands/${editing.id}` : "/api/brands";
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
        alert(data?.error || "Lỗi");
      }
    } catch {
      alert("Lỗi mạng");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa thương hiệu?")) return;
    const res = await fetch(`/api/brands/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("Xóa thất bại");
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4" /> Thêm thương hiệu
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editing ? "Sửa thương hiệu" : "Thương hiệu mới"}</h3>
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="name">Tên *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Quốc gia</Label>
              <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="VD: Đức" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoUrl">URL logo</Label>
              <Input id="logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
            </div>
          </div>
          <Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo"}</Button>
        </form>
      )}

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>Quốc gia</TableHead>
              <TableHead>Logo</TableHead>
              <TableHead>Số SP</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialBrands.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <div className="font-medium">{b.name}</div>
                  <div className="text-xs text-muted-foreground">/{b.slug}</div>
                </TableCell>
                <TableCell className="text-sm">{b.country || "—"}</TableCell>
                <TableCell>
                  {b.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.logoUrl} alt={b.name} className="h-8 w-8 rounded object-contain" />
                  ) : "—"}
                </TableCell>
                <TableCell className="text-sm">{b.productCount}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="icon" variant="outline" onClick={() => startEdit(b)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => handleDelete(b.id)}>
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
