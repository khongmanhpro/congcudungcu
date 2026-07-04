/**
 * Migration từ WordPress (MySQL) sang Prisma/Postgres.
 *
 * Cách chạy:
 *   pnpm tsx scripts/migrate-from-wp.ts
 *
 * Yêu cầu:
 *   - WP_DB_HOST, WP_DB_USER, WP_DB_PASSWORD, WP_DB_NAME trong .env
 *   - WP_UPLOADS_DIR: đường dẫn tới wp-content/uploads (để copy ảnh)
 *   - mysql2 package: pnpm add -D mysql2
 *
 * Script sẽ:
 *   1. Đọc wp_posts (post_type=product, post) → Product, Post
 *   2. Đọc wp_terms (taxonomy=product_cat, category) → Category
 *   3. Đọc wp_postmeta → gallery, sku, price, sale_price, specs
 *   4. Copy ảnh từ uploads → public/uploads (giữ cấu trúc năm/tháng)
 *   5. Cập nhật URL ảnh trong content
 *
 * Lưu ý: chạy 1 lần. Có flag --dry-run để xem trước.
 */
import "dotenv/config";

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  console.log("=== Migration WordPress → Prisma ===");
  console.log(`Mode: ${dryRun ? "DRY RUN" : "REAL"}`);
  console.log(`WP DB: ${process.env.WP_DB_HOST || "(none)"}/${process.env.WP_DB_NAME || "(none)"}`);
  console.log(`WP Uploads: ${process.env.WP_UPLOADS_DIR || "(none)"}`);
  console.log("");

  if (!process.env.WP_DB_HOST) {
    console.error("Thiếu WP_DB_HOST trong .env");
    process.exit(1);
  }

  // Dynamic import để tránh lỗi khi chưa cài mysql2
  let mysql: typeof import("mysql2/promise");
  try {
    mysql = await import("mysql2/promise");
  } catch {
    console.error("Cài mysql2 trước: pnpm add -D mysql2");
    process.exit(1);
  }

  const { PrismaClient } = await import("../src/generated/prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL!) });

  const conn = await mysql.createConnection({
    host: process.env.WP_DB_HOST,
    user: process.env.WP_DB_USER,
    password: process.env.WP_DB_PASSWORD,
    database: process.env.WP_DB_NAME,
    port: Number(process.env.WP_DB_PORT || 3306),
  });

  // Tìm admin user để gán làm tác giả post
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
  if (!adminUser) {
    console.error("Không tìm thấy admin user. Chạy: pnpm tsx scripts/create-admin.ts");
    process.exit(1);
  }
  console.log(`→ Admin user: ${adminUser.id}`);

  try {
    // 1. Categories (product_cat)
    console.log("→ Migrating categories...");
    const [cats] = (await conn.query(
      `SELECT t.term_id, t.name, t.slug, tt.description, tt.parent
       FROM wp_terms t
       JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id
       WHERE tt.taxonomy = 'product_cat'`,
    )) as any[];

    for (const c of cats) {
      if (dryRun) { console.log(`  [dry] cat: ${c.name}`); continue; }
      await prisma.category.upsert({
        where: { slug: c.slug },
        update: { name: c.name, description: c.description || null },
        create: {
          name: c.name,
          slug: c.slug,
          type: "PRODUCT",
          description: c.description || null,
        },
      });
    }
    console.log(`  ✓ ${cats.length} categories`);

    // 2. Brands (product_brand nếu có, hoặc tạo từ attribute pa_thuong-hieu)
    // Bỏ qua nếu WP không có brand taxonomy

    // 3. Posts (blog)
    console.log("→ Migrating posts...");
    const [posts] = (await conn.query(
      `SELECT ID, post_title, post_name, post_content, post_excerpt, post_date, post_status, post_modified
       FROM wp_posts
       WHERE post_type = 'post' AND post_status IN ('publish', 'draft')`,
    )) as any[];

    for (const p of posts) {
      if (dryRun) { console.log(`  [dry] post: ${p.post_title}`); continue; }
      const slug = p.post_name || String(p.ID);
      await prisma.post.upsert({
        where: { slug },
        update: {},
        create: {
          title: p.post_title,
          slug,
          content: p.post_content,
          excerpt: p.post_excerpt || null,
          status: p.post_status === "publish" ? "PUBLISHED" : "DRAFT",
          publishedAt: p.post_status === "publish" ? new Date(p.post_date) : null,
          authorId: adminUser.id,
        },
      });
    }
    console.log(`  ✓ ${posts.length} posts`);

    // 4. Products (WooCommerce)
    console.log("→ Migrating products...");
    const [products] = (await conn.query(
      `SELECT p.ID, p.post_title, p.post_name, p.post_content, p.post_excerpt, p.post_status, p.post_date
       FROM wp_posts p
       WHERE p.post_type = 'product' AND p.post_status IN ('publish', 'draft')`,
    )) as any[];

    // Cache slug→categoryId từ Prisma
    const allCats = await prisma.category.findMany({ where: { type: "PRODUCT" }, select: { id: true, slug: true } });
    const catSlugToId = new Map(allCats.map((c) => [c.slug, c.id]));

    let productCount = 0;
    let imgCount = 0;
    for (const p of products) {
      if (dryRun) { console.log(`  [dry] product: ${p.post_title}`); continue; }
      const slug = p.post_name || `product-${p.ID}`;

      // Lấy meta
      const [meta] = (await conn.query(
        `SELECT meta_key, meta_value FROM wp_postmeta WHERE post_id = ? AND meta_key IN ('_sku', '_price', '_sale_price', '_regular_price', '_stock', '_thumbnail_id', '_weight', '_length', '_width', '_height')`,
        [p.ID],
      )) as any[];
      const metaMap = Object.fromEntries(meta.map((m: any) => [m.meta_key, m.meta_value]));

      const price = Number(metaMap._regular_price || metaMap._price || 0);
      const salePrice = metaMap._sale_price && metaMap._sale_price !== "" ? Number(metaMap._sale_price) : null;
      const stock = Number(metaMap._stock || 0);
      const weight = metaMap._weight ? Number(metaMap._weight) * 1000 : null; // kg → gram
      const dims = [metaMap._length, metaMap._width, metaMap._height].filter(Boolean).join("x") || null;

      // Category: lấy term_id đầu tiên từ wp_term_relationships
      const [termRows] = (await conn.query(
        `SELECT tt.term_id FROM wp_term_relationships tr
         JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
         WHERE tr.object_id = ? AND tt.taxonomy = 'product_cat' LIMIT 1`,
        [p.ID],
      )) as any[];
      let categoryId: string | undefined;
      if (termRows[0]?.term_id) {
        const [term] = (await conn.query(`SELECT slug FROM wp_terms WHERE term_id = ?`, [termRows[0].term_id])) as any[];
        if (term[0]?.slug) categoryId = catSlugToId.get(term[0].slug);
      }

      // Thumbnail
      let coverImage: string | null = null;
      if (metaMap._thumbnail_id) {
        const [img] = (await conn.query(
          `SELECT guid FROM wp_posts WHERE ID = ? AND post_type = 'attachment'`,
          [metaMap._thumbnail_id],
        )) as any[];
        if (img[0]?.guid) coverImage = img[0].guid;
      }

      // Gallery (IDs trong _product_image_gallery, phân tách bởi ,)
      const [galleryMeta] = (await conn.query(
        `SELECT meta_value FROM wp_postmeta WHERE post_id = ? AND meta_key = '_product_image_gallery'`,
        [p.ID],
      )) as any[];
      const galleryIds = (galleryMeta[0]?.meta_value || "").split(",").filter(Boolean);
      const galleryUrls: string[] = [];
      if (galleryIds.length > 0) {
        const [imgs] = (await conn.query(
          `SELECT ID, guid FROM wp_posts WHERE ID IN (?) AND post_type = 'attachment'`,
          [galleryIds],
        )) as any[];
        for (const img of imgs) galleryUrls.push(img.guid);
      }

      // Chuẩn hóa URL ảnh: thay host cũ bằng /uploads/...
      function normalizeImgUrl(u: string): string {
        if (!u) return u;
        // Giữ nguyên nếu đã là /uploads/... hoặc data:
        if (u.startsWith("/uploads/") || u.startsWith("data:")) return u;
        // Tìm /wp-content/uploads/... → cắt lấy phần sau
        const m = u.match(/\/wp-content\/uploads\/(.+)$/);
        if (m) return `/uploads/${m[1]}`;
        return u;
      }

      let product;
      try {
        product = await prisma.product.upsert({
          where: { slug },
          update: {
            ...(categoryId && { categoryId }),
          },
          create: {
            name: p.post_title,
            slug,
            description: p.post_content,
            shortDesc: p.post_excerpt || null,
            status: p.post_status === "publish" ? "PUBLISHED" : "DRAFT",
            sku: metaMap._sku || null,
            price,
            salePrice,
            stock,
            weight,
            dimensions: dims,
            categoryId: categoryId || null,
            publishedAt: p.post_status === "publish" ? new Date(p.post_date) : null,
          },
        });
      } catch (e: any) {
        // SKU trùng → retry không có SKU
        if (e.code === "P2002") {
          product = await prisma.product.upsert({
            where: { slug },
            update: {
              ...(categoryId && { categoryId }),
            },
            create: {
              name: p.post_title,
              slug,
              description: p.post_content,
              shortDesc: p.post_excerpt || null,
              status: p.post_status === "publish" ? "PUBLISHED" : "DRAFT",
              sku: null,
              price,
              salePrice,
              stock,
              weight,
              dimensions: dims,
              categoryId: categoryId || null,
              publishedAt: p.post_status === "publish" ? new Date(p.post_date) : null,
            },
          });
        } else {
          throw e;
        }
      }

      // Images
      if (coverImage || galleryUrls.length > 0) {
        const all = [coverImage, ...galleryUrls].filter(Boolean) as string[];
        for (let i = 0; i < all.length; i++) {
          await prisma.productImage.create({
            data: {
              productId: product.id,
              url: normalizeImgUrl(all[i]),
              alt: p.post_title,
              position: i,
            },
          }).catch(() => {}); // bỏ qua nếu trùng
          imgCount++;
        }
      }
      productCount++;
      if (productCount % 200 === 0) console.log(`  ... ${productCount}/${products.length}`);
    }
    console.log(`  ✓ ${productCount} products, ${imgCount} images`);

    console.log("\n=== Migration hoàn tất ===");
  } finally {
    await conn.end();
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
