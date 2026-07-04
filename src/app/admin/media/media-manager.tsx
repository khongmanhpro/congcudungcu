"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Copy, Upload } from "lucide-react";

interface MediaItem {
  id: string;
  url: string;
  alt: string | null;
  type: string;
  createdAt: string;
}

export function MediaManager({ initialMedia }: { initialMedia: MediaItem[] }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;
    setSaving(true);
    try {
      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, alt: alt || null, type: "image" }),
      });
      if (res.ok) {
        setUrl("");
        setAlt("");
        router.refresh();
      } else alert("Lỗi thêm media");
    } catch {
      alert("Lỗi mạng");
    }
    setSaving(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("alt", alt);
    try {
      const res = await fetch("/api/media/upload", { method: "POST", body: fd });
      if (res.ok) {
        setAlt("");
        if (fileRef.current) fileRef.current.value = "";
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Lỗi upload");
      }
    } catch {
      alert("Lỗi mạng");
    }
    setUploading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa media?")) return;
    const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  function copyUrl(u: string) {
    navigator.clipboard.writeText(u);
    alert("Đã copy URL: " + u);
  }

  return (
    <div className="space-y-4">
      {/* Upload từ máy */}
      <div className="rounded-lg border bg-white p-5 space-y-4">
        <h3 className="font-semibold">Upload ảnh từ máy</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="file">Chọn file (JPG/PNG/WebP/GIF, tối đa 5MB)</Label>
            <input
              ref={fileRef}
              id="file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              onChange={handleUpload}
              disabled={uploading}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-white hover:file:bg-primary/90"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alt2">Alt text (tùy chọn)</Label>
            <Input id="alt2" value={alt} onChange={(e) => setAlt(e.target.value)} />
          </div>
        </div>
        {uploading && <p className="text-sm text-muted-foreground">Đang upload...</p>}
      </div>

      {/* Thêm bằng URL */}
      <form onSubmit={handleAdd} className="rounded-lg border bg-white p-5 space-y-4">
        <h3 className="font-semibold">Hoặc thêm bằng URL</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="url">URL ảnh *</Label>
            <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alt">Alt text</Label>
            <Input id="alt" value={alt} onChange={(e) => setAlt(e.target.value)} />
          </div>
        </div>
        <Button type="submit" disabled={saving}>
          <Plus className="h-4 w-4" /> {saving ? "Đang thêm..." : "Thêm"}
        </Button>
      </form>

      {initialMedia.length > 0 && (
        <div className="grid grid-cols-3 gap-3 md:grid-cols-5 lg:grid-cols-8">
          {initialMedia.map((m) => (
            <div key={m.id} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={m.alt || ""} className="aspect-square w-full rounded-md border object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex justify-between rounded-b-md bg-black/50 p-1 opacity-0 transition group-hover:opacity-100">
                <button onClick={() => copyUrl(m.url)} className="rounded p-1 text-white hover:bg-white/20">
                  <Copy className="h-3 w-3" />
                </button>
                <button onClick={() => handleDelete(m.id)} className="rounded p-1 text-white hover:bg-white/20">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
