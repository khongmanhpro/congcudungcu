import { prisma } from "@/lib/prisma";

export type Policy = { key: string; title: string; fallback: string };

/** Trang chính sách: slug → khoá Setting + nội dung mặc định. */
export const POLICIES: Record<string, Policy> = {
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
  "chinh-sach-ban-hang": {
    key: "policy_sales",
    title: "Chính sách bán hàng",
    fallback: "Sản phẩm chính hãng, có đầy đủ CO/CQ và hóa đơn VAT theo yêu cầu. Giá có thể thay đổi theo số lượng và thời điểm — vui lòng liên hệ để nhận báo giá tốt nhất.",
  },
  "phuong-thuc-thanh-toan": {
    key: "policy_payment",
    title: "Phương thức thanh toán",
    fallback: "Thanh toán khi nhận hàng (COD), thanh toán online qua VNPay hoặc chuyển khoản ngân hàng. Khách hàng doanh nghiệp có thể thanh toán theo hợp đồng.",
  },
  "tro-thanh-dai-ly": {
    key: "policy_dealer",
    title: "Trở thành đại lý",
    fallback: "Chúng tôi luôn chào đón đại lý, cửa hàng và nhà thầu trên toàn quốc với chính sách chiết khấu hấp dẫn. Vui lòng liên hệ hotline hoặc gửi yêu cầu để được tư vấn.",
  },
};

export async function getPolicyContent(policy: Policy): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key: policy.key } }).catch(() => null);
  return row?.value || policy.fallback;
}
