import "dotenv/config";
import pg from "pg";

async function main() {
  const c = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  console.log("=== on-sale products (comparePrice > 0) ===");
  const onSale = await c.query(`SELECT COUNT(*)::int FROM "Product" WHERE "comparePrice" IS NOT NULL AND "comparePrice" > 0`);
  console.log("count:", onSale.rows[0].count);

  console.log("\n=== headsets category ===");
  const cat = await c.query(`SELECT id, name, slug FROM "Category" WHERE slug='headsets'`);
  console.log("cat:", cat.rows[0]);

  if (cat.rows[0]) {
    const products = await c.query(`
      SELECT COUNT(*)::int
      FROM "Product" p
      JOIN "ProductCategory" pc ON pc."productId" = p.id
      WHERE pc."categoryId" = $1 AND p.status = 'ACTIVE'
    `, [cat.rows[0].id]);
    console.log("total headsets products:", products.rows[0].count);

    const withImg = await c.query(`
      SELECT COUNT(*)::int
      FROM "Product" p
      JOIN "ProductCategory" pc ON pc."productId" = p.id
      WHERE pc."categoryId" = $1 AND p.status = 'ACTIVE'
        AND EXISTS (SELECT 1 FROM "ProductImage" pi WHERE pi."productId" = p.id)
    `, [cat.rows[0].id]);
    console.log("with image:", withImg.rows[0].count);

    const onSaleInCat = await c.query(`
      SELECT COUNT(*)::int
      FROM "Product" p
      JOIN "ProductCategory" pc ON pc."productId" = p.id
      WHERE pc."categoryId" = $1 AND p.status = 'ACTIVE'
        AND p."comparePrice" IS NOT NULL AND p."comparePrice" > 0
    `, [cat.rows[0].id]);
    console.log("on-sale in headsets:", onSaleInCat.rows[0].count);
  }

  console.log("\n=== product status breakdown ===");
  const status = await c.query(`SELECT status, COUNT(*)::int FROM "Product" GROUP BY status`);
  console.log(status.rows);

  console.log("\n=== images per product ===");
  const noImg = await c.query(`
    SELECT COUNT(*)::int FROM "Product" p WHERE NOT EXISTS (SELECT 1 FROM "ProductImage" WHERE "productId"=p.id)
  `);
  console.log("products WITHOUT image:", noImg.rows[0].count);

  await c.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
