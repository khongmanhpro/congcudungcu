import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatVND } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Plus, Package, SearchCheck } from "lucide-react";
import { DeleteButton } from "../_components/delete-button";
import { ProductBulkManager } from "./bulk-actions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
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
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (status) where.status = status;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, brand: true, images: { take: 1, orderBy: { position: "asc" } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);
  const statusVariant: Record<string, "default" | "secondary" | "success" | "warning"> = {
    PUBLISHED: "success",
    DRAFT: "secondary",
    ARCHIVED: "warning",
  };
  const seoReady = (product: (typeof products)[number]) => Boolean(product.shortDesc && product.description && product.images.length > 0);
  const lowStock = products.filter((product) => product.stock <= 5).length;
  const seoIssues = products.filter((product) => !seoReady(product)).length;

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-[#d8e0ec] bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.14em] text-[#0757c9]">Catalog manager</div>
            <h1 className="mt-2 text-3xl font-black text-[#172033]">Sản phẩm</h1>
            <p className="mt-1 text-sm text-[#667085]">{total} sản phẩm, {seoIssues} mục cần kiểm tra SEO, {lowStock} mục tồn kho thấp trên trang này</p>
          </div>
          <Button asChild className="bg-[#0757c9] font-black hover:bg-[#0048a8]">
            <Link href="/admin/products/new">
              <Plus className="h-4 w-4" /> Thêm sản phẩm
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminSignal title="Đang hiển thị" value={products.length} icon={Package} tone="blue" />
        <AdminSignal title="Cần SEO" value={seoIssues} icon={SearchCheck} tone={seoIssues ? "orange" : "green"} />
        <AdminSignal title="Tồn kho thấp" value={lowStock} icon={AlertTriangle} tone={lowStock ? "orange" : "green"} />
      </div>

      <div className="flex items-center justify-between">
        <div>
        </div>
      </div>

      <form className="flex flex-col gap-2 rounded-md border border-[#d8e0ec] bg-white p-3 sm:flex-row" method="get">
        <input
          name="search"
          defaultValue={search}
          placeholder="Tìm theo tên..."
          className="h-10 flex-1 rounded-md border border-[#d8e0ec] bg-white px-3 text-sm outline-none focus:border-[#0757c9]"
        />
        <select name="status" defaultValue={status || ""} className="h-10 rounded-md border border-[#d8e0ec] bg-white px-3 text-sm outline-none focus:border-[#0757c9]">
          <option value="">Tất cả</option>
          <option value="PUBLISHED">Đã đăng</option>
          <option value="DRAFT">Bản nháp</option>
          <option value="ARCHIVED">Lưu trữ</option>
        </select>
        <Button type="submit" variant="outline" className="font-bold">Lọc</Button>
      </form>

      {products.length === 0 ? (
        <div className="rounded-md border border-[#d8e0ec] bg-white py-12 text-center text-[#667085]">
          <Package className="mx-auto mb-2 h-8 w-8 opacity-50" />
          Chưa có sản phẩm nào.
        </div>
      ) : (
        <ProductBulkManager
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            salePrice: p.salePrice,
            stock: p.stock,
            status: p.status,
          }))}
        />
      )}

      {/* Bảng chi tiết với link sửa/xóa */}
      <div className="overflow-hidden rounded-md border border-[#d8e0ec] bg-white">
        <table className="w-full">
          <thead className="border-b border-[#d8e0ec] bg-[#f7faff] text-xs uppercase tracking-wide text-[#667085]">
            <tr>
              <th className="p-3 text-left font-semibold">Sản phẩm</th>
              <th className="p-3 text-left font-semibold">SKU</th>
              <th className="p-3 text-left font-semibold">Giá/Kho</th>
              <th className="p-3 text-left font-semibold">SEO</th>
              <th className="p-3 text-left font-semibold">Trạng thái</th>
              <th className="p-3 text-right font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-[#edf1f7] last:border-0 hover:bg-[#fbfdff]">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0].url} alt={p.name} className="h-10 w-10 rounded border object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded border bg-neutral-100 text-xs text-neutral-400">IMG</div>
                    )}
                    <div>
                      <Link href={`/admin/products/${p.id}/edit`} className="font-bold text-[#172033] hover:text-[#0757c9]">{p.name}</Link>
                      <div className="text-xs text-[#667085]">{p.category?.name || "—"} · {p.brand?.name || "—"}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-sm">{p.sku || "—"}</td>
                <td className="p-3 text-sm">
                  <div className="font-black text-[#172033]">{formatVND(p.salePrice ?? p.price)}</div>
                  <div className={`text-xs font-bold ${p.stock <= 5 ? "text-[#ef233c]" : "text-[#667085]"}`}>Kho: {p.stock}</div>
                </td>
                <td className="p-3">
                  {seoReady(p) ? (
                    <span className="inline-flex items-center gap-1 rounded bg-[#ecfdf3] px-2 py-1 text-xs font-black text-[#16a34a]">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Đủ
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded bg-[#fff7ed] px-2 py-1 text-xs font-black text-[#f97316]">
                      <AlertTriangle className="h-3.5 w-3.5" /> Thiếu
                    </span>
                  )}
                </td>
                <td className="p-3"><Badge variant={statusVariant[p.status] || "default"}>{p.status}</Badge></td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline" className="font-bold">
                      <Link href={`/admin/products/${p.id}/edit`}>Sửa</Link>
                    </Button>
                    <DeleteButton endpoint={`/api/products/${p.id}`} label="sản phẩm" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/products?page=${p}${search ? `&search=${search}` : ""}${status ? `&status=${status}` : ""}`}
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

function AdminSignal({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number;
  icon: typeof Package;
  tone: "blue" | "green" | "orange";
}) {
  const toneClass = {
    blue: "bg-[#f0f6ff] text-[#0757c9]",
    green: "bg-[#ecfdf3] text-[#16a34a]",
    orange: "bg-[#fff7ed] text-[#f97316]",
  }[tone];

  return (
    <div className="rounded-md border border-[#d8e0ec] bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-[#667085]">{title}</div>
        <div className={`grid h-9 w-9 place-items-center rounded ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-2 text-2xl font-black text-[#172033]">{value}</div>
    </div>
  );
}
