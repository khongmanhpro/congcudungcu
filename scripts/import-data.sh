#!/usr/bin/env bash
# Nạp dữ liệu do scripts/export-data.sh tạo ra vào Postgres (Docker) và public/uploads.
#
#   bash scripts/import-data.sh <thư-mục-chứa congcudungcu.sql.gz và uploads-used.tar>
#
# CẢNH BÁO: xoá toàn bộ dữ liệu hiện có trong database đích rồi nạp lại từ dump.
set -euo pipefail

SRC="${1:?Cần đường dẫn thư mục dữ liệu, vd: bash scripts/import-data.sh ../congcudungcu-data}"
CONTAINER="${PG_CONTAINER:-congcudungcu-postgres}"
DB="${PG_DB:-congcudungcu}"
DB_USER="${PG_USER:-postgres}"
UPLOADS_DIR="${UPLOADS_DIR:-public/uploads}"

[ -f "$SRC/congcudungcu.sql.gz" ] || { echo "Không thấy $SRC/congcudungcu.sql.gz"; exit 1; }

if [ "${YES:-}" != "1" ]; then
  read -r -p "Xoá sạch database '$DB' trong container '$CONTAINER' rồi nạp dump? [y/N] " answer
  [ "$answer" = "y" ] || { echo "Huỷ."; exit 1; }
fi

echo "1/2 Nạp database ..."
docker exec -i "$CONTAINER" psql -q -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB" -c "SET client_min_messages = warning; DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
gunzip -c "$SRC/congcudungcu.sql.gz" | docker exec -i "$CONTAINER" psql -q -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB" > /dev/null
docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB" -tA -c \
  'SELECT format($$    sản phẩm: %s, danh mục: %s, bài viết: %s, đơn hàng: %s$$,
     (SELECT count(*) FROM "Product"), (SELECT count(*) FROM "Category"), (SELECT count(*) FROM "Post"), (SELECT count(*) FROM "Order"))'

if [ -f "$SRC/uploads-used.tar" ]; then
  echo "2/2 Giải nén ảnh vào $UPLOADS_DIR ..."
  mkdir -p "$UPLOADS_DIR"
  tar -xf "$SRC/uploads-used.tar" -C "$UPLOADS_DIR"
  echo "    $(find "$UPLOADS_DIR" -type f | wc -l | tr -d ' ') file, $(du -sh "$UPLOADS_DIR" | cut -f1)"
else
  echo "2/2 Không có uploads-used.tar — bỏ qua ảnh (dev có thể dùng UPLOADS_FALLBACK_ORIGIN)."
fi
echo "Xong."
