"use client";

import { useState, useTransition, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  salePrice: number | null;
  stock: number;
  status: string;
}

export function ProductBulkManager({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === products.length ? new Set() : new Set(products.map((p) => p.id))));
  }

  async function bulkUpdate(action: "publish" | "draft" | "archive" | "delete") {
    if (selected.size === 0) return;
    if (action === "delete" && !confirm(`Xóa ${selected.size} sản phẩm?`)) return;
    startTransition(async () => {
      await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), action }),
      });
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <ProductBulkContext.Provider value={{ selected, toggle, toggleAll }}>
      {selected.size > 0 && (
        <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 rounded-md border bg-primary/5 px-3 py-2 text-sm shadow-sm">
          <span className="font-medium">{selected.size} đã chọn</span>
          <Button size="sm" variant="outline" onClick={() => bulkUpdate("publish")} disabled={pending}>Đăng</Button>
          <Button size="sm" variant="outline" onClick={() => bulkUpdate("draft")} disabled={pending}>Nháp</Button>
          <Button size="sm" variant="outline" onClick={() => bulkUpdate("archive")} disabled={pending}>Lưu trữ</Button>
          <Button size="sm" variant="destructive" onClick={() => bulkUpdate("delete")} disabled={pending}>Xóa</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Bỏ chọn</Button>
        </div>
      )}
      <ProductTable products={products} />
    </ProductBulkContext.Provider>
  );
}

const ProductBulkContext = createContext<{
  selected: Set<string>;
  toggle: (id: string) => void;
  toggleAll: () => void;
}>({ selected: new Set(), toggle: () => {}, toggleAll: () => {} });

function ProductTable({ products }: { products: Product[] }) {
  const { selected, toggle, toggleAll } = useContext(ProductBulkContext);

  return (
    <div className="rounded-lg border bg-white">
      <table className="w-full">
        <thead className="border-b bg-neutral-50">
          <tr>
            <th className="w-10 p-3 text-left">
              <input
                type="checkbox"
                checked={selected.size === products.length && products.length > 0}
                onChange={toggleAll}
                className="h-4 w-4 accent-primary"
              />
            </th>
            <th className="p-3 text-left text-sm font-semibold">Sản phẩm</th>
            <th className="p-3 text-left text-sm font-semibold">Giá</th>
            <th className="p-3 text-left text-sm font-semibold">Kho</th>
            <th className="p-3 text-left text-sm font-semibold">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <ProductRow key={p.id} product={p} selected={selected.has(p.id)} onToggle={() => toggle(p.id)} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductRow({
  product,
  selected,
  onToggle,
}: {
  product: Product;
  selected: boolean;
  onToggle: () => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const router = useRouter();

  function startEdit(field: string, value: string | number | null) {
    setEditing(field);
    setEditValue(String(value ?? ""));
  }

  async function saveEdit() {
    if (!editing) return;
    const value = editing === "salePrice" && editValue === "" ? null : Number(editValue);
    if (isNaN(value as number) && value !== null) {
      setEditing(null);
      return;
    }
    await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [editing]: value }),
    });
    setEditing(null);
    router.refresh();
  }

  return (
    <tr className="border-b last:border-0 hover:bg-neutral-50">
      <td className="p-3">
        <input type="checkbox" checked={selected} onChange={onToggle} className="h-4 w-4 accent-primary" />
      </td>
      <td className="p-3">
        <div className="font-medium">{product.name}</div>
      </td>
      <td className="p-3">
        {editing === "price" ? (
          <EditCell value={editValue} onChange={setEditValue} onSave={saveEdit} onCancel={() => setEditing(null)} />
        ) : (
          <button onClick={() => startEdit("price", product.price)} className="flex items-center gap-1 font-medium hover:text-primary">
            {product.price.toLocaleString("vi-VN")}đ <Pencil className="h-3 w-3 opacity-50" />
          </button>
        )}
      </td>
      <td className="p-3">
        {editing === "stock" ? (
          <EditCell value={editValue} onChange={setEditValue} onSave={saveEdit} onCancel={() => setEditing(null)} />
        ) : (
          <button onClick={() => startEdit("stock", product.stock)} className={`flex items-center gap-1 hover:text-primary ${product.stock <= 5 ? "font-bold text-warning" : ""}`}>
            {product.stock} <Pencil className="h-3 w-3 opacity-50" />
          </button>
        )}
      </td>
      <td className="p-3 text-sm">{product.status}</td>
    </tr>
  );
}

function EditCell({
  value,
  onChange,
  onSave,
  onCancel,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave();
          if (e.key === "Escape") onCancel();
        }}
        className="h-8 w-24 rounded border px-2 text-sm"
      />
      <button onClick={onSave}><Check className="h-4 w-4 text-green-600" /></button>
      <button onClick={onCancel}><X className="h-4 w-4" /></button>
    </div>
  );
}
