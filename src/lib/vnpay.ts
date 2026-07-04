import { VNPay, ignoreLogger, ProductCode, VnpLocale, HashAlgorithm } from "vnpay";

/**
 * Khởi tạo VNPay client.
 * Cấu hình lấy từ env hoặc DB Setting (ưu tiên env).
 */
export function createVNPay(): VNPay {
  const tmnCode = process.env.VNPAY_TMN_CODE || "DEMO_TMN_CODE";
  const hashSecret = process.env.VNPAY_HASH_SECRET || "DEMO_HASH_SECRET";
  const returnUrl = process.env.VNPAY_RETURN_URL || "http://localhost:3000/thanh-toan/ket-qua";
  const isSandbox = process.env.VNPAY_SANDBOX !== "false";

  return new VNPay({
    tmnCode,
    secureSecret: hashSecret,
    vnpayHost: isSandbox ? "https://sandbox.vnpayment.vn" : "https://vnpayment.vn",
    testMode: isSandbox,
    hashAlgorithm: HashAlgorithm.SHA512,
    loggerFn: ignoreLogger,
    endpoints: {
      paymentEndpoint: "/paymentv2/vpcpay.html",
      queryDrRefundEndpoint: "/merchant_webapi/api/transaction",
      getBankListEndpoint: "/qrpayauth/banklist",
    },
  });
}

export { ProductCode, VnpLocale };
