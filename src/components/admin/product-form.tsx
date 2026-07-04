"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
import { slugify } from "@/lib/slug";
import { Plus, Trash2, X } from "lucide-react";

interface Category { id: string; name: string }
interface Brand { id: string; name: string }
interface ImageItem { url: string; alt?: string | null; position?: number }
interface SpecItem { label: string; value: string }

interface ProductData {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  salePrice: number | null;
  stock: number;
  shortDesc: string | null;
  description: string;
  specs: unknown;
  status: string;
  featured: boolean;
  weight: number | null;
  dimensions: string | null;
  categoryId: string | null;
  brandId: string | null;
  images: { id: string; url: string; alt: string | null; position: number }[];
  publishedAt: string | null;
}

export function ProductForm({
  product,
  categories,
  brands,
}: {
  product: ProductData | null;
  categories: Category[];
  brands: Brand[];
}) {
  const router = useRouter();
  const isEdit = !!product;

  const [name, setName] = useState(product?.name || "");
  const [slug, setSlug] = useState(product?.slug || "");
  const [sku, setSku] = useState(product?.sku || "");
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [salePrice, setSalePrice] = useState(String(product?.salePrice ?? ""));
  const [stock, setStock] = useState(String(product?.stock ?? "0"));
  const [shortDesc, setShortDesc] = useState(product?.shortDesc || "");
  const [description, setDescription] = useState(product?.description || "");
  const [specs, setSpecs] = useState<SpecItem[]>(
    product?.specs ? (product.specs as { items?: SpecItem[] } | SpecItem[]).constructor === Array
      ? (product.specs as SpecItem[])
      : ((product.specs as { items?: SpecItem[] }).items ?? [])
      : [],
  );
  const [status, setStatus] = useState(product?.status || "DRAFT");
  const [featured, setFeatured] = useState(product?.featured || false);
  const [weight, setWeight] = useState(String(product?.weight ?? ""));
  const [dimensions, setDimensions] = useState(product?.dimensions || "");
  const [categoryId, setCategoryId] = useState(product?.categoryId || "");
  const [brandId, setBrandId] = useState(product?.brandId || "");
  const [images, setImages] = useState<ImageItem[]>(
    product?.images.map((i) => ({ url: i.url, alt: i.alt, position: i.position })) || [],
  );
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image input
  const [imgUrl, setImgUrl] = useState("");
  const [imgAlt, setImgAlt] = useState("");

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  function addImage() {
    if (!imgUrl) return;
    setImages([...images, { url: imgUrl, alt: imgAlt || null, position: images.length }]);
    setImgUrl("");
    setImgAlt("");
  }

  function removeImage(i: number) {
    setImages(images.filter((_, idx) => idx !== i).map((img, idx) => ({ ...img, position: idx })));
  }

  function addSpec() {
    setSpecs([...specs, { label: "", value: "" }]);
  }

  function updateSpec(i: number, field: "label" | "value", val: string) {
    setSpecs(specs.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)));
  }

  function removeSpec(i: number) {
    setSpecs(specs.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name,
      slug,
      sku: sku || null,
      price: Number(price) || 0,
      salePrice: salePrice ? Number(salePrice) : null,
      stock: Number(stock) || 0,
      shortDesc: shortDesc || null,
      description,
      specs: specs.length ? { items: specs.filter((s) => s.label && s.value) } : null,
      status,
      featured,
      weight: weight ? Number(weight) : null,
      dimensions: dimensions || null,
      categoryId: categoryId || null,
      brandId: brandId || null,
      images: images.map((img, i) => ({ url: img.url, alt: img.alt, position: i })),
    };

    try {
      const url = isEdit ? `/api/products/${product!.id}` : "/api/products";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : JSON.stringify(data.error));
        setSaving(false);
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Lỗi mạng");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg border bg-white p-5 space-y-4">
            <h3 className="font-semibold">Thông tin cơ bản</h3>
            <div className="space-y-2">
              <Label htmlFor="name">Tên sản phẩm *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
                />
                <p className="text-xs text-muted-foreground">/san-pham/{slug || "..."}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Mã sản phẩm" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortDesc">Mô tả ngắn</Label>
              <Textarea id="shortDesc" value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} rows={2} />
            </div>
          </div>

          <div className="rounded-lg border bg-white p-5 space-y-4">
            <h3 className="font-semibold">Mô tả chi tiết</h3>
            <TiptapEditor value={description} onChange={setDescription} placeholder="Mô tả sản phẩm..." />
          </div>

          <div className="rounded-lg border bg-white p-5 space-y-4">
            <h3 className="font-semibold">Hình ảnh</h3>
            <div className="flex gap-2">
              <Input value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} placeholder="URL ảnh" />
              <Input value={imgAlt} onChange={(e) => setImgAlt(e.target.value)} placeholder="Alt text" />
              <Button type="button" variant="outline" onClick={addImage}>
                <Plus className="h-4 w-4" /> Thêm
              </Button>
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, i) => (
                  <div key={i} className="group relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt || ""} className="aspect-square w-full rounded-md border object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white opacity-0 transition group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Thông số kỹ thuật</h3>
              <Button type="button" variant="outline" size="sm" onClick={addSpec}>
                <Plus className="h-4 w-4" /> Thêm thông số
              </Button>
            </div>
            {specs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có thông số nào.</p>
            ) : (
              <div className="space-y-2">
                {specs.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={s.label} onChange={(e) => updateSpec(i, "label", e.target.value)} placeholder="Tên thông số" />
                    <Input value={s.value} onChange={(e) => updateSpec(i, "value", e.target.value)} placeholder="Giá trị" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSpec(i)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-white p-4 space-y-4">
            <h3 className="font-semibold">Xuất bản</h3>
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
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
              Sản phẩm nổi bật
            </label>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo sản phẩm"}
            </Button>
          </div>

          <div className="rounded-lg border bg-white p-4 space-y-4">
            <h3 className="font-semibold">Giá & Kho</h3>
            <div className="space-y-2">
              <Label htmlFor="price">Giá (VND) *</Label>
              <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice">Giá khuyến mãi</Label>
              <Input id="salePrice" type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Tồn kho</Label>
              <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
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
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandId">Thương hiệu</Label>
              <select
                id="brandId"
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">— Chọn —</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 space-y-4">
            <h3 className="font-semibold">Vận chuyển</h3>
            <div className="space-y-2">
              <Label htmlFor="weight">Khối lượng (gram)</Label>
              <Input id="weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dimensions">Kích thước</Label>
              <Input id="dimensions" value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="VD: 30x20x15cm" />
            </div>
          </div>
        </div>
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    </form>
  );
}
