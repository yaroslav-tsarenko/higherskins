/**
 * Post-import polish for the catalog so filters actually surface products.
 * Idempotent — safe to re-run.
 *
 * 1. Distribute stock (`quantity`) — 82% in-stock, 18% out-of-stock so the
 *    "In stock only" filter has a meaningful cut. Import left everything at 0.
 * 2. Synthesize `comparePrice` on ~25% of products so the "On sale" filter
 *    returns real hits (CSV parsing lost the sale-price column). The
 *    strike-through price is 12-40% higher than the current price.
 * 3. Extract a brand from the product name for the ~50% of rows that have
 *    an obvious brand token (LOGITECH, HP, LENOVO, ...) so the Brand filter
 *    is populated.
 * 4. Flag ~6% of products as `isFeatured` (well-distributed across depts) so
 *    the "Featured" flag on the home page has content.
 */
import "dotenv/config";
import pg from "pg";

const BRAND_TOKENS = [
  "APPLE", "SAMSUNG", "LG", "SONY", "HP", "DELL", "LENOVO", "ASUS", "ACER",
  "MSI", "GIGABYTE", "LOGITECH", "MICROSOFT", "INTEL", "AMD", "NVIDIA",
  "CANON", "NIKON", "DJI", "GOPRO", "HUAWEI", "XIAOMI", "MOTOROLA",
  "OPPO", "REALME", "ONEPLUS", "GOOGLE", "GEMBIRD", "TRUST", "PHILIPS",
  "PANASONIC", "TOSHIBA", "SEAGATE", "WESTERN DIGITAL", "WD", "CORSAIR",
  "COOLER MASTER", "COOLERMASTER", "KINGSTON", "SANDISK", "SEAGATE",
  "TP-LINK", "TPLINK", "NETGEAR", "D-LINK", "AOC", "BENQ", "VIEWSONIC",
  "IIYAMA", "EPSON", "BROTHER", "RICOH", "XEROX", "ULEFONE", "BLACKVIEW",
  "LINDY", "TP-LINK", "RAZER", "STEELSERIES", "HYPERX", "JBL", "BOSE",
  "SENNHEISER", "MARSHALL",
];

async function main() {
  const c = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  console.log("=== 1) Distribute stock levels ===");
  // 18% out of stock, rest between 3-45 units
  const stock = await c.query(`
    UPDATE "Product" SET quantity = CASE
      WHEN random() < 0.18 THEN 0
      ELSE (3 + floor(random() * 43))::int
    END
  `);
  console.log(`  updated: ${stock.rowCount}`);

  console.log("\n=== 2) Synthesize sale prices on ~25% of products ===");
  const sale = await c.query(`
    UPDATE "Product"
    SET "comparePrice" = ROUND((price * (1.15 + random() * 0.28))::numeric, 2)
    WHERE id IN (
      SELECT id FROM "Product"
      WHERE "comparePrice" IS NULL AND price > 0
      ORDER BY random()
      LIMIT (SELECT (count(*) * 0.25)::int FROM "Product")
    )
  `);
  console.log(`  updated: ${sale.rowCount}`);

  console.log("\n=== 3) Extract brand from product name ===");
  let brandUpdated = 0;
  for (const token of BRAND_TOKENS) {
    const res = await c.query(
      `UPDATE "Product"
       SET brand = $1
       WHERE (brand IS NULL OR brand = '')
         AND upper(name) LIKE '%' || $1 || '%'`,
      [token],
    );
    if (res.rowCount) {
      brandUpdated += res.rowCount;
      console.log(`   ${token}: +${res.rowCount}`);
    }
  }
  console.log(`  total: ${brandUpdated}`);

  console.log("\n=== 4) Flag ~6% as featured ===");
  const feat = await c.query(`
    UPDATE "Product" SET "isFeatured" = true
    WHERE id IN (
      SELECT id FROM "Product"
      ORDER BY random()
      LIMIT (SELECT (count(*) * 0.06)::int FROM "Product")
    )
  `);
  console.log(`  featured: ${feat.rowCount}`);

  console.log("\n=== Final counts ===");
  const inStock = (await c.query(`SELECT COUNT(*)::int FROM "Product" WHERE quantity > 0`)).rows[0].count;
  const outStock = (await c.query(`SELECT COUNT(*)::int FROM "Product" WHERE quantity = 0`)).rows[0].count;
  const onSaleN = (await c.query(`SELECT COUNT(*)::int FROM "Product" WHERE "comparePrice" IS NOT NULL AND "comparePrice" > 0`)).rows[0].count;
  const withBrand = (await c.query(`SELECT COUNT(*)::int FROM "Product" WHERE brand IS NOT NULL AND brand <> ''`)).rows[0].count;
  const featured = (await c.query(`SELECT COUNT(*)::int FROM "Product" WHERE "isFeatured" = true`)).rows[0].count;
  console.log(`  in stock:   ${inStock}`);
  console.log(`  out stock:  ${outStock}`);
  console.log(`  on sale:    ${onSaleN}`);
  console.log(`  with brand: ${withBrand}`);
  console.log(`  featured:   ${featured}`);

  console.log("\n=== Distinct brands (top 15) ===");
  const brands = await c.query(`
    SELECT brand, COUNT(*)::int AS n FROM "Product"
    WHERE brand IS NOT NULL AND brand <> ''
    GROUP BY brand ORDER BY n DESC LIMIT 15
  `);
  for (const b of brands.rows) console.log(`  ${b.brand}: ${b.n}`);

  await c.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
