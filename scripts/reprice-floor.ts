import "dotenv/config";
import pg from "pg";

// Lifts every listing priced below the marketplace floor into a realistic
// $3.00–$5.00 band, spread deterministically per-listing so the cheap end of the
// catalog doesn't collapse onto one identical price. Keeps each listing's Steam
// reference consistent with its discount, then recomputes each skin's
// lowestPrice. Idempotent — safe to run repeatedly.
const FLOOR = 3.0; // anything below this gets lifted
const BAND = 2.0; // spread width → new price lands in [FLOOR, FLOOR + BAND]

async function main() {
  const c = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  const before = await c.query(
    `SELECT count(*)::int AS n, MIN(price)::float AS min FROM "SkinListing" WHERE price < $1`,
    [FLOOR],
  );
  console.log(`Listings below $${FLOOR}: ${before.rows[0].n} (cheapest $${before.rows[0].min ?? "—"})`);

  // Deterministic per-id offset in [0, BAND] from the row's hash, so re-running
  // produces the same prices instead of drifting.
  const upd = await c.query(
    `UPDATE "SkinListing"
       SET price = ROUND(($1 + (((hashtext(id) % 201) + 201) % 201) / 100.0 * ($2 / 2.0))::numeric, 2),
           "steamPrice" = ROUND(
             (($1 + (((hashtext(id) % 201) + 201) % 201) / 100.0 * ($2 / 2.0))
               / (1 - COALESCE("discountPct", 0) / 100))::numeric, 2)
     WHERE price < $1
     RETURNING id`,
    [FLOOR, BAND],
  );
  console.log(`Listings repriced: ${upd.rowCount}`);

  const low = await c.query(
    `UPDATE "Skin" s
        SET "lowestPrice" = sub.min_price
       FROM (
         SELECT "skinId", MIN(price) AS min_price
           FROM "SkinListing"
          WHERE status = 'available'
          GROUP BY "skinId"
       ) sub
      WHERE s.id = sub."skinId"
        AND s."lowestPrice" IS DISTINCT FROM sub.min_price
      RETURNING s.id`,
  );
  console.log(`Skin.lowestPrice rows updated: ${low.rowCount}`);

  const check = await c.query(`SELECT MIN(price)::float AS min FROM "SkinListing"`);
  console.log(`New cheapest listing: $${check.rows[0].min}`);

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
