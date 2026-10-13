# congcudungcu-next — Project Guide

## Stack
- Next.js 16 App Router (Turbopack), TypeScript strict
- Prisma 7 + PostgreSQL (local Docker / Supabase sau), client generate vào `src/generated/prisma`
- Tailwind CSS, shadcn/ui (manual components)
- Tiptap editor (admin posts)
- Zustand (cart store, persisted)
- Recharts (admin reports)
- vnpay SDK (payment)
- bcrypt + JWT session cookie (auth, sẽ chuyển Supabase Auth sau)

## Commands
- `pnpm dev` — dev server
- `pnpm build` — production build (chạy typecheck)
- `pnpm start` — production server
- `pnpm lint` — eslint
- `pnpm db:migrate` — tạo migration
- `pnpm db:push` — đẩy schema thẳng vào DB (không tạo migration)
- `pnpm db:generate` — regenerate client
- `pnpm db:studio` — DB GUI
- `pnpm db:seed` — seed dữ liệu mẫu
- `pnpm exec tsx scripts/create-admin.ts <email> <password>` — tạo/đặt lại mật khẩu admin
- `pnpm migrate:wp` — migrate từ WordPress (cần mysql2)
- Docker: `docker-compose up -d --build` (app ở http://localhost:3001); chạy script trong container: `docker-compose run --rm migrate pnpm db:seed`

## Environment (.env)
- `DATABASE_URL` — Postgres connection string
- `DIRECT_URL` — direct connection (migrations)
- `JWT_SECRET` — secret cho session JWT
- `NEXT_PUBLIC_SITE_URL` — public URL (sitemap, SEO)
- `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_SANDBOX`, `VNPAY_RETURN_URL`
- `WP_DB_*`, `WP_UPLOADS_DIR` — cho migration script

## Structure
- `src/app/(store)/` — storefront routes (header/footer layout)
- `src/app/admin/` — admin panel (protected by middleware)
- `src/app/api/` — API routes
- `src/components/ui/` — shadcn/ui components
- `src/components/store/` — storefront components
- `src/lib/` — prisma, session, format, vnpay, cart-store
- `prisma/` — schema, migrations, seed
- `scripts/` — create-admin, migrate-from-wp

## Routes
### Storefront
- `/` — home
- `/san-pham` — product list (filter by category, sort)
- `/san-pham/[slug]` — product detail (JSON-LD, related)
- `/danh-muc/[slug]` — category page
- `/tim-kiem?q=` — search
- `/gio-hang` — cart (zustand persisted)
- `/thanh-toan` — checkout (COD / VNPay)
- `/thanh-toan/thanh-cong` — payment success
- `/thanh-toan/that-bai` — payment failed
- `/tin-tuc` — blog list
- `/tin-tuc/[slug]` — blog detail (JSON-LD)
- `/lien-he` — contact (form → QuoteRequest)
- `/tai-khoan` — customer account (orders history)

### Admin (/admin, protected)
- Dashboard, Posts, Products, Categories, Brands, Media, Orders, Customers, Coupons, Reports/Revenue, Settings

### API
- `/api/auth/*` — login, logout
- `/api/posts`, `/api/posts/[id]`
- `/api/products`, `/api/products/[id]`
- `/api/categories`, `/api/categories/[id]`
- `/api/brands`, `/api/brands/[id]`
- `/api/media`, `/api/media/[id]`
- `/api/orders`, `/api/orders/[id]`
- `/api/coupons`, `/api/coupons/[id]`
- `/api/settings`
- `/api/checkout` — tạo order + VNPay payment URL
- `/api/vnpay/return` — VNPay return callback
- `/api/contact` — form liên hệ

### SEO
- `/sitemap.xml` — dynamic sitemap (products, posts, categories)
- `/robots.txt` — disallow /admin, /api
- JSON-LD: Product, Article
- Metadata: OG, Twitter card, canonical

## Auth
- Session cookie `cdc_session` chứa JWT (userId, email, role)
- `getSession()` — đọc session từ cookie
- `getCurrentUser()` — trả về user object
- middleware.ts bảo vệ `/admin/*` (redirect → /login)
- Roles: ADMIN, EDITOR (xem/sửa content), CUSTOMER (mua hàng)

## Payment (VNPay)
- Sandbox: https://sandbox.vnpayment.vn
- Flow: checkout → tạo order PENDING + payment PENDING → redirect VNPay → return URL → verify signature → update order PAID + payment SUCCESS → trừ kho
- COD: tạo order PENDING, không tạo payment

## Cart
- Zustand store persisted trong localStorage key `cdc-cart`
- Item: { id, name, slug, price, salePrice, image, qty, stock }

## Notes
- lucide-react v1: không có Youtube/Facebook icon → dùng text "FB"/"YT"
- Prisma: `Order.customerId` (không phải userId), `Setting` (không phải SiteSettings), `QuoteRequest.content` (không phải message)
- publishedAt serialize ISO string cho client components

## Nội dung & SEO (content-as-code)
- Nội dung danh mục/thương hiệu/bài kiến thức lưu trong repo: `content/categories.json`, `content/brands.json`, `content/posts/*.md` → nạp bằng `pnpm exec tsx scripts/content/apply-content.ts` (có `--dry-run`, kiểm tra link nội bộ, idempotent).
- Taxonomy + thương hiệu + mã model: `scripts/content/taxonomy.ts`, `brands.ts` → `pnpm exec tsx scripts/content/classify.ts` (có `--dry-run`, báo cáo `tmp/content-reports/classify.csv`).
- Viết lại mô tả sản phẩm: `scripts/content/rewrite.ts` (`facts`/`import` khi viết bằng Claude Code; `submit`/`collect` khi dùng API) → duyệt ở `/admin/content-review`.
- Kiểm tra SEO onpage: `node scripts/seo-audit.mjs [baseUrl] [mẫu/loại]`.
- **Quy trình khi nạp dump dữ liệu thật** (import-data.sh XOÁ SẠCH DB — nội dung nằm trong repo nên nạp lại được):
  1. `bash scripts/import-data.sh <thư mục dump>`
  2. `pnpm exec prisma migrate deploy`
  3. `pnpm exec tsx scripts/content/classify.ts`
  4. `pnpm exec tsx scripts/content/apply-content.ts`
- URL: danh mục ở gốc (`/kim/kim-cat`), sản phẩm `/san-pham/<slug>`, hãng `/thuong-hieu/<slug>[/<danh-mục>]`, bài `/kien-thuc/<slug>`. Luôn tạo link bằng `src/lib/urls.ts`. Đổi slug trong admin tự tạo redirect 301 (`Redirect`).
- Env bắt buộc khi deploy: `SITE_URL=https://congcudungcu.vn` (canonical/sitemap/robots đọc lúc chạy), `JWT_SECRET` ngẫu nhiên, tùy chọn `INDEXNOW_KEY`.
