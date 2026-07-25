import "dotenv/config";
import pg from "pg";

async function main() {
  const c = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  console.log("=== CATEGORIES ===");
  const cats = await c.query(`
    SELECT c.id, c.name, c.slug, c."parentId",
           (SELECT count(*)::int FROM "ProductCategory" pc WHERE pc."categoryId" = c.id) AS products
    FROM "Category" c
    ORDER BY c."parentId" NULLS FIRST, c.name
  `);
  for (const r of cats.rows) {
    console.log(`  ${r.slug.padEnd(30)} name="${r.name}" parent=${r.parentId ?? "-"} products=${r.products}`);
  }

  console.log("\n=== TOP 30 PRODUCT NAMES ===");
  const p = await c.query(`SELECT name, sku, price, brand FROM "Product" ORDER BY random() LIMIT 30`);
  for (const r of p.rows) console.log(`  ${r.name.padEnd(50)} | sku=${r.sku} | brand=${r.brand ?? "-"} | £${r.price}`);

  console.log("\n=== BRANDS ===");
  const b = await c.query(`SELECT brand, count(*)::int AS n FROM "Product" WHERE brand IS NOT NULL AND brand<>'' GROUP BY brand ORDER BY n DESC LIMIT 30`);
  for (const r of b.rows) console.log(`  ${r.brand} — ${r.n}`);
  console.log(`Total distinct brands: ${(await c.query(`SELECT count(DISTINCT brand)::int AS n FROM "Product" WHERE brand IS NOT NULL AND brand<>''`)).rows[0].n}`);

  console.log("\n=== VARIANT OPTIONS KEYS ===");
  const vk = await c.query(`SELECT jsonb_object_keys(options) AS k, count(*)::int AS n FROM "ProductVariant" GROUP BY k ORDER BY n DESC`);
  for (const r of vk.rows) console.log(`  ${r.k} — ${r.n}`);

  console.log("\n=== SAMPLE VARIANT OPTIONS ===");
  const vv = await c.query(`SELECT options FROM "ProductVariant" LIMIT 15`);
  for (const r of vv.rows) console.log(`  ${JSON.stringify(r.options)}`);

  console.log("\n=== DISTINCT SIZE VALUES ===");
  const sz = await c.query(`SELECT DISTINCT options->>'Size' AS v FROM "ProductVariant" WHERE options ? 'Size' ORDER BY v`);
  console.log("  " + sz.rows.map((r) => r.v).join(", "));

  console.log("\n=== DISTINCT COLOR VALUES ===");
  const cl = await c.query(`SELECT DISTINCT options->>'Color' AS v FROM "ProductVariant" WHERE options ? 'Color'`);
  console.log("  " + cl.rows.map((r) => r.v).join(", "));

  console.log("\n=== PRICE RANGES ===");
  const pr = await c.query(`SELECT min(price)::float AS min, max(price)::float AS max, avg(price)::float AS avg FROM "Product"`);
  console.log(`  min=£${pr.rows[0].min.toFixed(2)} max=£${pr.rows[0].max.toFixed(2)} avg=£${pr.rows[0].avg.toFixed(2)}`);

  console.log("\n=== TAG SAMPLES ===");
  const tg = await c.query(`SELECT metadata->'tags' AS tags FROM "Product" WHERE metadata IS NOT NULL LIMIT 5`);
  for (const r of tg.rows) console.log("  " + JSON.stringify(r.tags));

  console.log("\n=== CONTENT TABLES COUNTS ===");
  const rows = await Promise.all([
    c.query(`SELECT count(*)::int AS n FROM "Banner"`),
    c.query(`SELECT count(*)::int AS n FROM "HomepageSection"`),
    c.query(`SELECT count(*)::int AS n FROM "HomepageTab"`),
    c.query(`SELECT count(*)::int AS n FROM "PromoStripItem"`),
    c.query(`SELECT count(*)::int AS n FROM "Brand"`),
    c.query(`SELECT count(*)::int AS n FROM "UtilityLink"`),
    c.query(`SELECT count(*)::int AS n FROM "Page"`),
  ]);
  const labels = ["Banner", "HomepageSection", "HomepageTab", "PromoStripItem", "Brand", "UtilityLink", "Page"];
  labels.forEach((l, i) => console.log(`  ${l}: ${rows[i].rows[0].n}`));

  const ss = await c.query(`SELECT id, name, description, currency FROM "StoreSettings"`);
  console.log(`\n=== STORE SETTINGS ===\n  ${JSON.stringify(ss.rows[0] ?? {})}`);

  await c.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
