# Docker Deployment Guide - congcudungcu-next

## Tổng quan
Dự án đã được cấu hình để chạy bằng Docker với PostgreSQL database. Cấu hình bao gồm:
- Next.js App Router với standalone output
- PostgreSQL 16 database
- Prisma ORM
- Multi-stage Docker build cho tối ưu kích thước image
- Prisma migration service chạy trước app

## Các file đã tạo

### 1. Dockerfile
Multi-stage build với 3 stages:
- **deps**: Cài đặt dependencies
- **builder**: Build Next.js application
- **runner**: Production-ready image với minimal dependencies

### 2. docker-compose.yml
Định nghĩa 3 services:
- **postgres**: PostgreSQL 16 database với healthcheck
- **migrate**: Chạy `prisma migrate deploy`
- **app**: Next.js application với environment variables

### 3. .dockerignore
Loại bỏ các file không cần thiết để giảm kích thước build context

### 4. .env.docker
Environment variables mẫu cho Docker environment

## Cách sử dụng

### Local Development với Docker

```bash
# Build, migrate và chạy containers
docker compose --env-file .env.docker up -d --build

# Xem logs
docker compose logs -f app

# Dừng containers
docker compose down

# Xem status
docker compose ps
```

### Truy cập ứng dụng
- Frontend: http://localhost:3001
- Database: localhost:5432

### Database Migration
Migration được chạy tự động bởi service `migrate` trong `docker-compose.yml`.

Chạy riêng migration khi cần:
```bash
docker compose --env-file .env.docker run --rm migrate
```

Kiểm tra bảng sau migration:
```bash
docker exec congcudungcu-postgres psql -U postgres -d congcudungcu -c '\dt'
```

Lưu ý: migration chỉ tạo schema. Để VPS có sản phẩm/bài viết thật, cần import bản backup PostgreSQL hiện tại.

```bash
# Export từ database local hiện tại
pg_dump "$DATABASE_URL" > congcudungcu-backup.sql

# Restore vào Docker PostgreSQL
docker exec -i congcudungcu-postgres psql -U postgres -d congcudungcu < congcudungcu-backup.sql
```

## Deploy lên VPS

### 1. Chuẩn bị VPS
```bash
# Cài đặt Docker và Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Cài đặt Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Upload code lên VPS
```bash
# Sử dụng git
git clone <repository-url>
cd congcudungcu-next

# Hoặc sử dụng scp/rsync
scp -r . user@vps-ip:/path/to/app
```

### 3. Cấu hình Environment Variables
```bash
# Copy và chỉnh sửa .env file
cp .env.docker .env

# Chỉnh sửa các giá trị cần thiết:
# - JWT_SECRET (bắt buộc - tạo random string)
# - VNPAY_TMN_CODE, VNPAY_HASH_SECRET (nếu dùng VNPay)
# - SMTP_* (nếu dùng email)
# - NEXT_PUBLIC_SITE_URL (đổi thành domain thực tế)
```

### 4. Build và chạy
```bash
# Build images
docker-compose build

# Chạy containers
docker compose --env-file .env.docker up -d --build

# Kiểm tra logs
docker compose logs -f
```

### 5. Cấu hình Nginx (Reverse Proxy)
Tạo file `/etc/nginx/sites-available/congcudungcu`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/congcudungcu /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL với Let's Encrypt
```bash
# Cài đặt Certbot
sudo apt install certbot python3-certbot-nginx

# Tạo SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Troubleshooting

### Container không start
```bash
# Kiểm tra logs
docker-compose logs app
docker-compose logs postgres

# Kiểm tra status
docker-compose ps

# Rebuild
docker-compose down
docker-compose up -d --build
```

### Database connection issues
```bash
# Kiểm tra PostgreSQL container
docker exec congcudungcu-postgres psql -U postgres -d congcudungcu

# Test connection từ app container
docker exec congcudungcu-app sh -c "nc -zv postgres 5432"
```

### Port conflicts
Nếu port 3001 đã được sử dụng, thay đổi trong docker-compose.yml:
```yaml
ports:
  - "3002:3000"  # Thay đổi port mapping
```

## Environment Variables quan trọng

### Bắt buộc
- `DATABASE_URL`: PostgreSQL connection string
- `DIRECT_URL`: Direct connection cho migrations
- `JWT_SECRET`: Secret cho session authentication

### Tùy chọn
- `VNPAY_*`: Cấu hình VNPay payment
- `SMTP_*`: Cấu hình email
- `NEXT_PUBLIC_SUPABASE_*`: Nếu dùng Supabase

## Backup và Restore

### Backup database
```bash
# Backup từ Docker container
docker exec congcudungcu-postgres pg_dump -U postgres congcudungcu > backup.sql

# Backup volume
docker run --rm -v congcudungcu-next_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

### Restore database
```bash
# Restore SQL dump
cat backup.sql | docker exec -i congcudungcu-postgres psql -U postgres -d congcudungcu

# Restore volume
docker run --rm -v congcudungcu-next_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /
```

## Monitoring

### Health check
```bash
# Kiểm tra container status
docker-compose ps

# Kiểm tra resource usage
docker stats
```

### Logs
```bash
# Real-time logs
docker-compose logs -f app

# Logs của 100 dòng cuối
docker-compose logs --tail=100 app
```

## Security Recommendations

1. **Đổi password PostgreSQL mặc định**
2. **Sử dụng strong JWT_SECRET**
3. **Không commit .env file**
4. **Sử dụng secrets management tool** (Docker Secrets, AWS Secrets Manager, etc.)
5. **Regular updates**: `docker-compose pull && docker-compose up -d`
6. **Firewall**: Chỉ mở port cần thiết (80, 443)

## Scaling

### Horizontal scaling với Docker Swarm
```yaml
# docker-compose.yml
services:
  app:
    deploy:
      replicas: 3
```

### Load balancing
Sử dụng Nginx hoặc HAProxy để load balance giữa multiple instances

## Lưu ý quan trọng

1. **Database Migration**: Do Prisma 7.x thay đổi cấu hình, migration cần được thực hiện cẩn thận. Khuyến nghị chạy migration từ local machine hoặc sử dụng init container riêng biệt.

2. **Persistent Data**: Database data được lưu trong Docker volume `postgres_data`, đảm bảo backup volume này.

3. **Production Environment Variables**: Luôn sử dụng strong secrets và không commit vào git.

4. **Resource Limits**: Có thể thêm resource limits trong docker-compose.yml cho production:
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
```

## Cleanup

### Dọn dẹp sau khi test
```bash
# Dừng và xóa containers
docker-compose down

# Xóa volumes (cẩn thận - sẽ mất data)
docker-compose down -v

# Xóa images
docker rmi congcudungcu-next-app
```

## Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra logs: `docker-compose logs`
2. Kiểm tra network: `docker network ls`
3. Kiểm tra volumes: `docker volume ls`
4. Rebuild từ đầu: `docker-compose down && docker-compose up -d --build`
