import "dotenv/config";
import pg from "pg";

async function main() {
  const c = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  const p = await c.query(
    `UPDATE "Product"
       SET quantity = 999,
           "trackInventory" = false
     WHERE quantity < 999 OR "trackInventory" = true
     RETURNING id`,
  );
  console.log(`Product rows updated: ${p.rowCount}`);

  const v = await c.query(
    `UPDATE "ProductVariant"
       SET quantity = 999
     WHERE quantity < 999
     RETURNING id`,
  );
  console.log(`ProductVariant rows updated: ${v.rowCount}`);

  const check = await c.query(`
    SELECT
      (SELECT count(*)::int FROM "Product" WHERE quantity > 0) AS products_in_stock,
      (SELECT count(*)::int FROM "Product" WHERE "trackInventory") AS tracked,
      (SELECT count(*)::int FROM "ProductVariant" WHERE quantity > 0) AS variants_in_stock
  `);
  console.log("After:", check.rows[0]);

  await c.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
