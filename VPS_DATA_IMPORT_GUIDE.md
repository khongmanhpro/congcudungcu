# Hướng dẫn đưa dữ liệu thật lên VPS

## Tổng quan

VPS chạy code bằng Docker (xem `DOCKER_DEPLOYMENT.md`). Database trên VPS lúc đầu chỉ có schema
rỗng (sau `docker compose run --rm migrate`). Local hiện có:

- **3.180 sản phẩm** (crawl từ trang công khai + viết lại mô tả bằng AI — xem lưu ý bên dưới)
- **73 danh mục**, **27 thương hiệu**, **9 bài kiến thức**
- Ảnh sản phẩm đã tải về `public/uploads/` (không nằm trong git — xem `.gitignore`)

> ⚠️ **Dữ liệu sản phẩm hiện tại KHÔNG phải dữ liệu nội bộ thật** (giá, tồn kho, mô tả gốc). Mô
> tả sản phẩm do AI viết lại từ tên sản phẩm, chưa có người duyệt (`contentStatus = AI_PUBLISHED`,
> xem `/admin/content-review`). Một số tên/hãng/mã sản phẩm còn nghi vấn — xem
> `tmp/content-drafts/DATA-ISSUES.md` (không nằm trong git, chỉ có trên máy đã chạy việc này).
> Khi có dữ liệu nội bộ thật (Excel/ERP/nhà cung cấp), làm theo quy trình trong `AGENTS.md` mục
> "Nội dung & SEO" thay vì dùng bản dump này.

## Bước 1 — Export từ local

```bash
cd /Volumes/data/code/congcudungcu   # thư mục project trên máy đang chạy việc này

# Database (đọc DATABASE_URL trong .env — mặc định postgres:postgres@localhost:5432/congcudungcu)
pg_dump "postgresql://postgres:postgres@localhost:5432/congcudungcu" \
  --no-owner --no-privileges > congcudungcu-backup.sql

# Ảnh sản phẩm (~45MB)
tar -czf congcudungcu-uploads.tar.gz -C public uploads
```

Hai file này **không push lên GitHub** (dump DB + ảnh không thuộc về code) — chỉ chuyển thẳng lên VPS.

## Bước 2 — Chuyển lên VPS

```bash
scp congcudungcu-backup.sql congcudungcu-uploads.tar.gz user@your-vps-ip:/path/to/project/
```

## Bước 3 — Nạp trên VPS

```bash
ssh user@your-vps-ip
cd /path/to/project

# Giải nén ảnh vào đúng chỗ docker-compose.yml đang mount (./public/uploads:/app/public/uploads)
tar -xzf congcudungcu-uploads.tar.gz -C public

# Nạp database — XOÁ SẠCH schema cũ trước để tránh lỗi "relation already exists"
docker exec congcudungcu-postgres psql -U postgres -d congcudungcu \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker exec -i congcudungcu-postgres psql -U postgres -d congcudungcu < congcudungcu-backup.sql

# Restart để app đọc dữ liệu mới
docker compose restart app
docker compose logs -f app
```

## Bước 4 — Kiểm tra

```bash
docker exec congcudungcu-postgres psql -U postgres -d congcudungcu -c "
SELECT (SELECT COUNT(*) FROM \"Product\") AS sp,
       (SELECT COUNT(*) FROM \"Category\") AS danh_muc,
       (SELECT COUNT(*) FROM \"Brand\") AS thuong_hieu,
       (SELECT COUNT(*) FROM \"Post\") AS bai_viet;"
# Kỳ vọng: 3180 | 73+ (danh mục cả cha/con/bài viết) | 27 | 9

curl -I http://localhost:3001/                    # trang chủ
curl -I http://localhost:3001/uploads/<tên-1-ảnh-bất-kỳ>.webp   # ảnh phải 200, không qua site cũ nữa
```

## ⚠️ Bắt buộc làm NGAY sau khi deploy (bảo mật)

1. **Đổi `JWT_SECRET`** trong `.env` trên VPS sang chuỗi ngẫu nhiên thật (`openssl rand -hex 32`),
   khác với giá trị mẫu trong `.env.docker` của repo. Không đổi thì phiên đăng nhập admin không an toàn.
2. **Đổi mật khẩu admin.** Tài khoản demo hiện tại là `admin@congcudungcu.com` / mật khẩu mẫu —
   đổi ngay bằng `pnpm exec tsx scripts/create-admin.ts <email> <mật khẩu mới>` trong container.
3. **Điền `VNPAY_TMN_CODE`/`VNPAY_HASH_SECRET` thật** nếu đã có — `.env.docker` hiện để placeholder
   `your-tmn-code`, chưa thể nhận thanh toán thật.

## Khi có dữ liệu nội bộ thật (dump Excel/ERP/nhà cung cấp)

Không lặp lại quy trình pg_dump ở trên — làm theo `AGENTS.md`:

```bash
bash scripts/import-data.sh <thư mục dump>   # XOÁ SẠCH DB rồi nạp lại — nội dung AI/taxonomy
pnpm exec prisma migrate deploy               # nằm trong repo (content/*.json, scripts/content/*)
pnpm exec tsx scripts/content/classify.ts     # nên chạy lại được từ đầu
pnpm exec tsx scripts/content/apply-content.ts
```

## Xử lý lỗi thường gặp

**"relation already exists"** khi import: DB đã có bảng từ migration trước đó — chạy lại 2 lệnh
`DROP SCHEMA` ở Bước 3 trước khi `psql < congcudungcu-backup.sql`.

**App không nhận dữ liệu mới**: `docker compose restart app` (ISR cache `revalidate` theo giây đã
khai trong từng trang, không cần rebuild image).

**Ảnh 404 dù đã giải nén `uploads.tar.gz`**: tên file trong DB phải khớp tên file trên đĩa — kiểm
`docker exec congcudungcu-app ls /app/public/uploads | wc -l` phải ra đúng số ảnh đã tar. Next.js
standalone có thể cache "không tìm thấy" từ trước khi ảnh tồn tại — `docker restart congcudungcu-app`
(khởi động lại tiến trình, không phải `docker compose up --build`) nếu vẫn 404 sau khi file đã có.

## Backup trên VPS (nên làm định kỳ)

```bash
docker exec congcudungcu-postgres pg_dump -U postgres --no-owner --no-privileges congcudungcu \
  > congcudungcu-vps-backup-$(date +%F).sql
tar -czf uploads-backup-$(date +%F).tar.gz public/uploads/
```
