# Hướng dẫn Import Data Thật vào VPS

## Tổng quan

Dự án hiện tại trên VPS đã chạy được nhưng chưa có data thật. Database hiện tại chỉ có schema rỗng hoặc data mẫu.

## Thông tin Data Thật

- **Sản phẩm**: 3,205 sản phẩm
- **Danh mục**: 13 danh mục
- **Thương hiệu**: 1 thương hiệu
- **Bài viết**: 100 bài viết
- **Đơn hàng**: 2 đơn hàng
- **Users**: 1 user

## Cách 1: Export từ Local và Import vào VPS (Khuyên dùng)

### Bước 1: Export database thật từ local

**Trên máy local của bạn:**

```bash
# Di chuyển đến thư mục project
cd /Users/khongmanh/congcudungcu-next

# Export database thật (localhost:5433) sang file SQL
docker run --rm -v $(pwd):/backup postgres:16-alpine bash -c \
  "PGPASSWORD=cdc pg_dump -h host.docker.internal -p 5433 -U cdc -d congcudungcu" > congcudungcu-backup.sql
```

Hoặc nếu bạn đã cài PostgreSQL trên local:

```bash
pg_dump "postgresql://cdc:cdc@localhost:5433/congcudungcu" > congcudungcu-backup.sql
```

### Bước 2: Upload file backup lên VPS

```bash
# Upload file SQL lên VPS
scp congcudungcu-backup.sql user@your-vps-ip:/path/to/project/

# Hoặc sử dụng rsync cho file lớn
rsync -avz congcudungcu-backup.sql user@your-vps-ip:/path/to/project/
```

### Bước 3: Import vào VPS

**SSH vào VPS:**

```bash
ssh user@your-vps-ip
```

**Trên VPS:**

```bash
# Di chuyển đến thư mục project
cd /path/to/project

# Kiểm tra file backup đã upload chưa
ls -lh congcudungcu-backup.sql

# Import vào Docker PostgreSQL
docker exec -i congcudungcu-postgres psql -U postgres -d congcudungcu < congcudungcu-backup.sql

# Restart app để nhận dữ liệu mới
docker compose restart app

# Kiểm tra logs
docker compose logs -f app
```

### Bước 4: Kiểm tra data

```bash
# Kiểm tra số lượng sản phẩm
docker exec congcudungcu-postgres psql -U postgres -d congcudungcu -c "SELECT COUNT(*) FROM \"Product\";"

# Kiểm tra số lượng danh mục
docker exec congcudungcu-postgres psql -U postgres -d congcudungcu -c "SELECT COUNT(*) FROM \"Category\";"

# Kiểm tra số lượng bài viết
docker exec congcudungcu-postgres psql -U postgres -d congcudungcu -c "SELECT COUNT(*) FROM \"Post\";"
```

## Cách 2: Import từ WordPress (nếu data đang ở WordPress)

Nếu data của bạn đang ở WordPress, sử dụng script migration:

### Bước 1: Cấu hình .env trên VPS

```bash
# Thêm cấu hình WordPress vào .env trên VPS
WP_DB_HOST=your-wp-db-host
WP_DB_USER=your-wp-db-user
WP_DB_PASSWORD=your-wp-db-password
WP_DB_NAME=your-wp-db-name
WP_DB_PORT=3306
WP_UPLOADS_DIR=/path/to/wp-content/uploads
```

### Bước 2: Chạy migration script

```bash
# SSH vào VPS
ssh user@your-vps-ip

# Di chuyển đến thư mục project
cd /path/to/project

# Cài mysql2
pnpm add -D mysql2

# Chạy migration script
pnpm tsx scripts/migrate-from-wp.ts

# Restart app
docker compose restart app
```

## Cách 3: Export/Import trực tiếp giữa Local và VPS

Nếu bạn có quyền truy cập trực tiếp giữa local và VPS:

### Trên Local:

```bash
# Export data
docker run --rm -v $(pwd):/backup postgres:16-alpine bash -c \
  "PGPASSWORD=cdc pg_dump -h host.docker.internal -p 5433 -U cdc -d congcudungcu" > congcudungcu-backup.sql

# Upload và import trong 1 lệnh
cat congcudungcu-backup.sql | ssh user@your-vps-ip "docker exec -i congcudungcu-postgres psql -U postgres -d congcudungcu"
```

### Trên VPS:

```bash
# Restart app
docker compose restart app
```

## Xử lý Lỗi Thường Gặp

### Lỗi: "relation already exists"

Nếu import bị lỗi do bảng đã tồn tại:

```bash
# Xóa toàn bộ database và tạo lại
docker exec congcudungcu-postgres psql -U postgres -d congcudungcu -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Chạy migration lại
docker compose --env-file .env.docker run --rm migrate

# Import data
docker exec -i congcudungcu-postgres psql -U postgres -d congcudungcu < congcudungcu-backup.sql

# Restart app
docker compose restart app
```

### Lỗi: "permission denied"

```bash
# Đảm bảo file backup có quyền đọc
chmod 644 congcudungcu-backup.sql

# Thử import lại
docker exec -i congcudungcu-postgres psql -U postgres -d congcudungcu < congcudungcu-backup.sql
```

### Lỗi: App không nhận data mới

```bash
# Restart app
docker compose restart app

# Hoặc rebuild và restart
docker compose up -d --build

# Kiểm tra logs
docker compose logs -f app
```

## Kiểm tra Sau Khi Import

### 1. Kiểm tra database

```bash
# Kiểm tra số lượng bảng
docker exec congcudungcu-postgres psql -U postgres -d congcudungcu -c "\dt"

# Kiểm tra số lượng records
docker exec congcudungcu-postgres psql -U postgres -d congcudungcu -c "
SELECT 
  (SELECT COUNT(*) FROM \"Product\") as products,
  (SELECT COUNT(*) FROM \"Category\") as categories,
  (SELECT COUNT(*) FROM \"Post\") as posts,
  (SELECT COUNT(*) FROM \"Order\") as orders;
"
```

### 2. Kiểm tra app

```bash
# Test API
curl http://your-vps-ip/api/products

# Test trang sản phẩm
curl http://your-vps-ip/san-pham

# Kiểm tra logs
docker compose logs app
```

### 3. Kiểm tra images

Nếu có images trong uploads:

```bash
# Kiểm tra thư mục uploads
ls -lh public/uploads/

# Nếu chưa có, cần copy từ WordPress uploads
scp -r /path/to/wp-content/uploads/* user@your-vps-ip:/path/to/project/public/uploads/
```

## Backup Data trên VPS

Sau khi import thành công, nên backup data:

```bash
# Backup database
docker exec congcudungcu-postgres pg_dump -U postgres congcudungcu > congcudungcu-vps-backup.sql

# Backup uploads
tar -czf uploads-backup.tar.gz public/uploads/

# Download về local
scp user@your-vps-ip:/path/to/project/congcudungcu-vps-backup.sql ./
scp user@your-vps-ip:/path/to/project/uploads-backup.tar.gz ./
```

## Yêu cầu cho Codex

Khi yêu cầu Codex thực hiện import data, cung cấp thông tin sau:

```
Tôi cần import data thật vào VPS cho dự án congcudungcu-next.

Thông tin:
- File backup: congcudungcu-backup.sql (đã export từ local)
- VPS IP: [your-vps-ip]
- VPS user: [your-vps-user]
- Project path: [path-to-project-on-vps]
- Docker container name: congcudungcu-postgres

Các bước cần làm:
1. SSH vào VPS
2. Di chuyển đến thư mục project
3. Kiểm tra file backup đã upload chưa
4. Import vào Docker PostgreSQL
5. Restart app
6. Kiểm tra data đã import thành công
7. Kiểm tra app hoạt động bình thường

Data cần import:
- 3,205 sản phẩm
- 13 danh mục
- 1 thương hiệu
- 100 bài viết
- 2 đơn hàng
- 1 user
```

## Lưu ý Quan Trọng

1. **File SQL quá lớn**: File backup ~16MB, không nên push lên GitHub. Chỉ upload trực tiếp lên VPS.
2. **Backup trước khi import**: Luôn backup data hiện tại trên VPS trước khi import mới.
3. **Test trên local trước**: Nên test import trên local Docker trước khi làm trên VPS.
4. **Images**: Nếu có images, cần copy thư mục uploads từ WordPress sang public/uploads.
5. **Environment variables**: Đảm bảo .env trên VPS đã cấu hình đúng.
6. **Permissions**: Đảm bảo user có quyền truy cập database và files.

## Liên hệ

Nếu gặp vấn đề, kiểm tra:
- Docker logs: `docker compose logs`
- Database connection: `docker compose ps`
- File permissions: `ls -la`
- Network: `docker network inspect`
