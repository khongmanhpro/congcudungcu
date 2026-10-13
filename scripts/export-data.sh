#!/usr/bin/env bash
# Xuất dữ liệu thật để chuyển máy: database + CHỈ những ảnh đang được dùng.
#
# Chạy trên VPS, trong thư mục dự án (nơi có public/uploads và container Postgres):
#   bash scripts/export-data.sh [thư-mục-đích]   (mặc định: ./data-export)
#
# Tạo ra:
#   congcudungcu.sql.gz   – pg_dump (nén)
#   uploads-used.tar      – ảnh trong public/uploads mà DB đang tham chiếu
#   uploads-missing.txt   – đường dẫn ảnh DB tham chiếu nhưng không có file (nếu có)
#
# KHÔNG commit thư mục này vào repo public: dump có dữ liệu khách hàng.
set -euo pipefail

OUT="${1:-./data-export}"
CONTAINER="${PG_CONTAINER:-congcudungcu-postgres}"
DB="${PG_DB:-congcudungcu}"
DB_USER="${PG_USER:-postgres}"
UPLOADS_DIR="${UPLOADS_DIR:-public/uploads}"

mkdir -p "$OUT"
SQL="$OUT/congcudungcu.sql"

echo "1/3 Dump database từ container $CONTAINER ..."
docker exec "$CONTAINER" pg_dump -U "$DB_USER" --no-owner --no-privileges "$DB" > "$SQL"
echo "    $(du -h "$SQL" | cut -f1) SQL"

echo "2/3 Lọc ảnh đang được dùng ..."
# Bắt mọi chuỗi /uploads/... trong dump (ảnh sản phẩm, danh mục, bài viết, ảnh trong nội dung HTML)
grep -oE '/uploads/[^"'"'"' )<>\\,;]+\.(jpe?g|png|gif|webp|svg|avif|pdf)' "$SQL" \
  | sed 's#^/uploads/##' | sort -u > "$OUT/uploads-referenced.txt"
REF_COUNT=$(wc -l < "$OUT/uploads-referenced.txt" | tr -d ' ')

: > "$OUT/uploads-existing.txt"
: > "$OUT/uploads-missing.txt"
while IFS= read -r rel; do
  if [ -f "$UPLOADS_DIR/$rel" ]; then echo "$rel" >> "$OUT/uploads-existing.txt"; else echo "$rel" >> "$OUT/uploads-missing.txt"; fi
done < "$OUT/uploads-referenced.txt"
echo "    DB tham chiếu $REF_COUNT ảnh, có file: $(wc -l < "$OUT/uploads-existing.txt" | tr -d ' '), thiếu: $(wc -l < "$OUT/uploads-missing.txt" | tr -d ' ')"

echo "3/3 Đóng gói ..."
tar -cf "$OUT/uploads-used.tar" -C "$UPLOADS_DIR" -T "$OUT/uploads-existing.txt"
gzip -f "$SQL"
rm -f "$OUT/uploads-referenced.txt" "$OUT/uploads-existing.txt"
[ -s "$OUT/uploads-missing.txt" ] || rm -f "$OUT/uploads-missing.txt"

echo
echo "Xong. Dung lượng:"
du -h "$OUT"/* | sed 's/^/    /'
echo "Toàn bộ public/uploads hiện tại: $(du -sh "$UPLOADS_DIR" | cut -f1) (so sánh với uploads-used.tar ở trên)"
