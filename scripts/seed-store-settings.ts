import "dotenv/config";
import pg from "pg";

async function main() {
  const c = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  const now = new Date().toISOString();
  await c.query(
    `INSERT INTO "StoreSettings" (id, name, description, "primaryColor", "secondaryColor", email, currency, "taxRate", "freeShippingMin", "metaTitle", "metaDescription", "updatedAt")
     VALUES ('default', $1, $2, '#0F172A', '#FFFFFF', 'info@higherskins.com', 'GBP', 20, 100, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE
       SET name = EXCLUDED.name,
           description = EXCLUDED.description,
           email = EXCLUDED.email,
           currency = EXCLUDED.currency,
           "taxRate" = EXCLUDED."taxRate",
           "freeShippingMin" = EXCLUDED."freeShippingMin",
           "metaTitle" = EXCLUDED."metaTitle",
           "metaDescription" = EXCLUDED."metaDescription",
           "updatedAt" = EXCLUDED."updatedAt"`,
    [
      "Higherskins",
      "Refined athletic apparel for men, women and kids. Shipped from the United Kingdom.",
      "Higherskins — Refined athletic apparel",
      "Curated apparel from Higherskins — sustainably sourced tees, hoodies and swimwear for men, women and kids. Shipped from the United Kingdom.",
      now,
    ],
  );
  console.log("StoreSettings upserted.");
  await c.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
