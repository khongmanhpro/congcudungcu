import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [
    { slug: "chinh-sach-bao-hanh" },
    { slug: "chinh-sach-doi-tra" },
    { slug: "van-chuyen" },
    { slug: "chinh-sach-bao-mat" },
  ];
}

async function getPolicy(key: string) {
  const s = await prisma.setting.findUnique({ where: { key } });
  return s?.value || null;
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const map: Record<string, { key: string; title: string; fallback: string }> = {
    "chinh-sach-bao-hanh": {
      key: "policy_warranty",
      title: "Chính sách bảo hành",
      fallback: "Tất cả sản phẩm được bảo hành chính hãng từ 1-3 năm tùy loại. Quý khách mang sản phẩm cùng hóa đơn đến cửa hàng hoặc gửi về công ty để được bảo hành miễn phí trong thời gian bảo hành.",
    },
    "chinh-sach-doi-tra": {
      key: "policy_returns",
      title: "Chính sách đổi trả",
      fallback: "Đổi trả trong vòng 7 ngày kể từ ngày nhận hàng. Sản phẩm phải còn nguyên tem, hộp, phụ kiện. Hoàn tiền 100% nếu sản phẩm lỗi do nhà sản xuất.",
    },
    "van-chuyen": {
      key: "policy_shipping",
      title: "Chính sách vận chuyển",
      fallback: "Giao hàng toàn quốc trong 2-5 ngày làm việc. Miễn phí giao hàng cho đơn hàng từ 500.000đ. Hỗ trợ giao hỏa tốc trong nội thành trong 2-4 giờ.",
    },
    "chinh-sach-bao-mat": {
      key: "policy_privacy",
      title: "Chính sách bảo mật",
      fallback: "Chúng tôi cam kết bảo mật thông tin cá nhân của khách hàng. Không chia sẻ, bán cho bên thứ ba. Dữ liệu chỉ dùng để xử lý đơn hàng và liên hệ khi cần.",
    },
  };

  const meta = map[slug];
  if (!meta) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">Trang không tìm thấy.</div>;

  const content = await getPolicy(meta.key);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Trang chủ</Link> / <span>{meta.title}</span>
      </nav>
      <h1 className="mb-6 text-2xl font-bold">{meta.title}</h1>
      <div className="prose prose-sm max-w-none whitespace-pre-line text-neutral-700">
        {content || meta.fallback}
      </div>
    </div>
  );
}
