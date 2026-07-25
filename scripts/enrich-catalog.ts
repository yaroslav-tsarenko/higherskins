import "dotenv/config";
import pg from "pg";

/**
 * Enrich the imported WooCommerce catalog:
 *   1. Auto-classify products into sub-sub-categories using keyword rules.
 *   2. Populate Category.imageUrl using the first ProductImage of any product
 *      in that category (or any descendant).
 *   3. Populate Banner.imageUrl using a representative product image for each
 *      themed banner (hero / promo / deal).
 */

interface Rule {
  parentSlug: string;
  name: string;
  slug: string;
  match: (name: string) => boolean;
}

const RULES: Rule[] = [
  // ── Men > Bottoms ─────────────────────────────────
  { parentSlug: "men-bottoms", name: "Sweatpants",   slug: "men-bottoms-sweatpants",   match: (n) => /\b(sweatpant|jogger)/i.test(n) },
  { parentSlug: "men-bottoms", name: "Leggings",     slug: "men-bottoms-leggings",     match: (n) => /\b(legging|compression tight)/i.test(n) },
  { parentSlug: "men-bottoms", name: "Swim Trunks",  slug: "men-bottoms-swim-trunks",  match: (n) => /\b(swim trunk|board short|swim short)/i.test(n) },
  { parentSlug: "men-bottoms", name: "Shorts",       slug: "men-bottoms-shorts",       match: (n) => /\bshort/i.test(n) },
  { parentSlug: "men-bottoms", name: "Trousers",     slug: "men-bottoms-trousers",     match: (n) => /(wide-leg|wide leg|chino|\btrouser|\bpants?\b)/i.test(n) && !/sweatpant/i.test(n) },

  // ── Men > T-shirts ────────────────────────────────
  { parentSlug: "men-t-shirts", name: "Long Sleeve",       slug: "men-t-shirts-long-sleeve",  match: (n) => /\blong.?sleeve/i.test(n) },
  { parentSlug: "men-t-shirts", name: "Tank Tops",         slug: "men-t-shirts-tanks",        match: (n) => /\b(tank|vest|sleeveless)/i.test(n) },
  { parentSlug: "men-t-shirts", name: "Polo Shirts",       slug: "men-t-shirts-polos",        match: (n) => /\bpolo/i.test(n) },
  { parentSlug: "men-t-shirts", name: "Jerseys",           slug: "men-t-shirts-jerseys",      match: (n) => /\bjersey/i.test(n) },
  { parentSlug: "men-t-shirts", name: "Athletic Tees",     slug: "men-t-shirts-athletic",     match: (n) => /\b(athletic|performance|quick.?dry|compression|sport)/i.test(n) },
  { parentSlug: "men-t-shirts", name: "All-Over Prints",   slug: "men-t-shirts-all-over",     match: (n) => /\ball.?over/i.test(n) },
  { parentSlug: "men-t-shirts", name: "Graphic Tees",      slug: "men-t-shirts-graphic",      match: (n) => /\b(graphic|logo|print)/i.test(n) },

  // ── Men > Sweatshirts ─────────────────────────────
  { parentSlug: "men-sweatshirts", name: "Zip Hoodies",   slug: "men-sweatshirts-zip-hoodies", match: (n) => /\b(zip.?up|full.?zip|zip hood)/i.test(n) },
  { parentSlug: "men-sweatshirts", name: "Hoodies",       slug: "men-sweatshirts-hoodies",     match: (n) => /\bhood/i.test(n) },
  { parentSlug: "men-sweatshirts", name: "Crewnecks",     slug: "men-sweatshirts-crewnecks",   match: (n) => /\bcrew/i.test(n) },
  { parentSlug: "men-sweatshirts", name: "Performance",   slug: "men-sweatshirts-performance", match: (n) => /\b(athletic|performance|quick.?dry|compression|sport)/i.test(n) },

  // ── Women > Bottoms ───────────────────────────────
  { parentSlug: "women-bottoms", name: "Leggings",   slug: "women-bottoms-leggings",   match: (n) => /\b(legging|compression tight)/i.test(n) },
  { parentSlug: "women-bottoms", name: "Sweatpants", slug: "women-bottoms-sweatpants", match: (n) => /\b(sweatpant|jogger)/i.test(n) },
  { parentSlug: "women-bottoms", name: "Shorts",     slug: "women-bottoms-shorts",     match: (n) => /\bshort/i.test(n) },
  { parentSlug: "women-bottoms", name: "Skirts",     slug: "women-bottoms-skirts",     match: (n) => /\bskirt/i.test(n) },
  { parentSlug: "women-bottoms", name: "Trousers",   slug: "women-bottoms-trousers",   match: (n) => /(wide-leg|wide leg|chino|\btrouser|\bpants?\b)/i.test(n) && !/sweatpant/i.test(n) },

  // ── Women > T-shirts ──────────────────────────────
  { parentSlug: "women-t-shirts", name: "Crop Tops",       slug: "women-t-shirts-crop",         match: (n) => /\bcrop/i.test(n) },
  { parentSlug: "women-t-shirts", name: "Sports Bras",     slug: "women-t-shirts-sports-bras",  match: (n) => /\b(sports? bra|bralette|bustier)/i.test(n) },
  { parentSlug: "women-t-shirts", name: "Tank Tops",       slug: "women-t-shirts-tanks",        match: (n) => /\b(tank|vest|sleeveless)/i.test(n) },
  { parentSlug: "women-t-shirts", name: "Long Sleeve",     slug: "women-t-shirts-long-sleeve",  match: (n) => /\blong.?sleeve/i.test(n) },
  { parentSlug: "women-t-shirts", name: "V-Neck",          slug: "women-t-shirts-v-neck",       match: (n) => /\bv.?neck/i.test(n) },
  { parentSlug: "women-t-shirts", name: "Polo Shirts",     slug: "women-t-shirts-polos",        match: (n) => /\bpolo/i.test(n) },
  { parentSlug: "women-t-shirts", name: "Athletic Tees",   slug: "women-t-shirts-athletic",     match: (n) => /\b(athletic|performance|quick.?dry|compression|sport)/i.test(n) },
  { parentSlug: "women-t-shirts", name: "All-Over Prints", slug: "women-t-shirts-all-over",     match: (n) => /\ball.?over/i.test(n) },

  // ── Women > Swimwear ──────────────────────────────
  { parentSlug: "women-swimwear", name: "Bikinis",     slug: "women-swimwear-bikinis",     match: (n) => /\bbikini/i.test(n) },
  { parentSlug: "women-swimwear", name: "One-Piece",   slug: "women-swimwear-one-piece",   match: (n) => /\b(one.?piece|monokini)/i.test(n) },
  { parentSlug: "women-swimwear", name: "Cover-Ups",   slug: "women-swimwear-cover-ups",   match: (n) => /\b(cover.?up|kaftan|sarong|beach dress)/i.test(n) },
  { parentSlug: "women-swimwear", name: "Swim Shorts", slug: "women-swimwear-shorts",      match: (n) => /\b(swim short|board short)/i.test(n) },

  // ── Kids > Hoodies & sweatshirts ──────────────────
  { parentSlug: "kids-hoodies-sweatshirts", name: "Youth Hoodies",   slug: "kids-hoodies-youth",    match: (n) => /\byouth/i.test(n) },
  { parentSlug: "kids-hoodies-sweatshirts", name: "Toddler Hoodies", slug: "kids-hoodies-toddler",  match: (n) => /\btoddler/i.test(n) },
  { parentSlug: "kids-hoodies-sweatshirts", name: "Zip Hoodies",     slug: "kids-hoodies-zip",      match: (n) => /\b(zip.?up|full.?zip|zip hood)/i.test(n) },

  // ── Kids > T-shirts ───────────────────────────────
  { parentSlug: "kids-t-shirts", name: "Youth Tees",   slug: "kids-t-shirts-youth",       match: (n) => /\byouth/i.test(n) },
  { parentSlug: "kids-t-shirts", name: "Toddler Tees", slug: "kids-t-shirts-toddler",     match: (n) => /\btoddler/i.test(n) },
  { parentSlug: "kids-t-shirts", name: "Baby Tees",    slug: "kids-t-shirts-baby",        match: (n) => /\b(baby|infant)/i.test(n) },
  { parentSlug: "kids-t-shirts", name: "Long Sleeve",  slug: "kids-t-shirts-long-sleeve", match: (n) => /\blong.?sleeve/i.test(n) },
  { parentSlug: "kids-t-shirts", name: "All-Over Prints", slug: "kids-t-shirts-all-over", match: (n) => /\ball.?over/i.test(n) },
];

function cuid(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 10);
  return `c${ts}${rand}${Math.random().toString(36).substring(2, 6)}`;
}

async function main() {
  const c = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  const now = new Date().toISOString();

  // ── Phase 1: fetch existing categories to resolve parent ids ──
  const catRes = await c.query(`SELECT id, slug FROM "Category"`);
  const slugToId = new Map<string, string>();
  for (const r of catRes.rows) slugToId.set(r.slug, r.id);

  // ── Phase 2: create sub-sub-categories from RULES ──
  console.log("Creating sub-sub-categories…");
  for (const rule of RULES) {
    const parentId = slugToId.get(rule.parentSlug);
    if (!parentId) {
      console.warn(`  skipping ${rule.slug} — parent ${rule.parentSlug} not found`);
      continue;
    }
    const id = slugToId.get(rule.slug) ?? cuid();
    await c.query(
      `INSERT INTO "Category" (id, name, slug, "parentId", "sortOrder", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, 0, true, $5, $5)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, "parentId" = EXCLUDED."parentId"`,
      [id, rule.name, rule.slug, parentId, now],
    );
    slugToId.set(rule.slug, id);
  }
  console.log(`  ${RULES.length} rules processed`);

  // ── Phase 3: classify each product into new sub-sub-categories ──
  console.log("Classifying products…");
  const productsRes = await c.query(`
    SELECT p.id, p.name, array_agg(pc."categoryId") AS cat_ids
    FROM "Product" p
    LEFT JOIN "ProductCategory" pc ON pc."productId" = p.id
    GROUP BY p.id
  `);
  type Row = { id: string; name: string; cat_ids: (string | null)[] };
  const products: Row[] = productsRes.rows;

  const idToSlug = new Map<string, string>();
  for (const [slug, id] of slugToId) idToSlug.set(id, slug);

  const newLinks: { productId: string; categoryId: string }[] = [];

  for (const p of products) {
    const parentSlugs = new Set<string>();
    for (const cid of p.cat_ids) {
      if (cid) parentSlugs.add(idToSlug.get(cid) ?? "");
    }
    for (const rule of RULES) {
      if (!parentSlugs.has(rule.parentSlug)) continue;
      if (!rule.match(p.name)) continue;
      const targetId = slugToId.get(rule.slug);
      if (!targetId) continue;
      newLinks.push({ productId: p.id, categoryId: targetId });
    }
  }
  console.log(`  ${newLinks.length} new product↔category links`);

  // Batch insert product-category links
  for (let i = 0; i < newLinks.length; i += 500) {
    const batch = newLinks.slice(i, i + 500);
    const values: unknown[] = [];
    const placeholders: string[] = [];
    batch.forEach((l, j) => {
      placeholders.push(`($${j * 2 + 1},$${j * 2 + 2})`);
      values.push(l.productId, l.categoryId);
    });
    await c.query(
      `INSERT INTO "ProductCategory" ("productId", "categoryId")
       VALUES ${placeholders.join(",")}
       ON CONFLICT DO NOTHING`,
      values,
    );
    process.stdout.write(`\r  links inserted: ${Math.min(i + 500, newLinks.length)}/${newLinks.length}`);
  }
  console.log();

  // ── Phase 4: populate Category.imageUrl using product images ──
  console.log("Populating category images…");
  // Walk all categories, for each one pick first image of any product in
  // that category or its descendant subtree.
  const allCats = await c.query(`
    WITH RECURSIVE cat_tree AS (
      SELECT id, id AS root_id FROM "Category"
      UNION ALL
      SELECT c.id, ct.root_id
      FROM "Category" c
      JOIN cat_tree ct ON c."parentId" = ct.id
    )
    SELECT ct.root_id, min(pi.url) AS image_url
    FROM cat_tree ct
    JOIN "ProductCategory" pc ON pc."categoryId" = ct.id
    JOIN "ProductImage" pi ON pi."productId" = pc."productId" AND pi."sortOrder" = 0
    GROUP BY ct.root_id
  `);
  for (const r of allCats.rows) {
    await c.query(
      `UPDATE "Category" SET "imageUrl" = $1 WHERE id = $2 AND ("imageUrl" IS NULL OR "imageUrl" = '')`,
      [r.image_url, r.root_id],
    );
  }
  console.log(`  ${allCats.rows.length} categories imaged`);

  // ── Phase 5: populate Banner.imageUrl ──
  console.log("Populating banner images…");
  // Pick a nice product image per themed banner id.
  const bannerMap: { id: string; catSlug: string }[] = [
    // hero
    { id: "seed-hero-0",       catSlug: "men-t-shirts" },
    { id: "seed-hero-1",       catSlug: "women-swimwear" },
    { id: "seed-hero-2",       catSlug: "kids-t-shirts" },
    // deal cards
    { id: "seed-deal-0",       catSlug: "women-bottoms" },
    { id: "seed-deal-1",       catSlug: "men-sweatshirts" },
    // small promos
    { id: "seed-promo-small-0", catSlug: "men" },
    { id: "seed-promo-small-1", catSlug: "women" },
    { id: "seed-promo-small-2", catSlug: "kids" },
    // wide promo
    { id: "seed-promo-wide-0", catSlug: "men" },
  ];

  for (const b of bannerMap) {
    const catId = slugToId.get(b.catSlug);
    if (!catId) continue;
    const img = await c.query(
      `SELECT pi.url
       FROM "ProductCategory" pc
       JOIN "ProductImage" pi ON pi."productId" = pc."productId" AND pi."sortOrder" = 0
       WHERE pc."categoryId" = $1
       ORDER BY random() LIMIT 1`,
      [catId],
    );
    const url = img.rows[0]?.url;
    if (!url) continue;
    await c.query(`UPDATE "Banner" SET "imageUrl" = $1 WHERE id = $2`, [url, b.id]);
  }
  console.log(`  ${bannerMap.length} banner images set`);

  // ── Summary ──
  const catCount = await c.query(`SELECT count(*)::int AS n FROM "Category"`);
  const catImg   = await c.query(`SELECT count(*)::int AS n FROM "Category" WHERE "imageUrl" IS NOT NULL AND "imageUrl" <> ''`);
  const pcCount  = await c.query(`SELECT count(*)::int AS n FROM "ProductCategory"`);
  const bImg     = await c.query(`SELECT count(*)::int AS n FROM "Banner" WHERE "imageUrl" IS NOT NULL AND "imageUrl" <> ''`);
  console.log("\nDone.");
  console.log(`  Categories total: ${catCount.rows[0].n} (${catImg.rows[0].n} with imageUrl)`);
  console.log(`  Product-category links: ${pcCount.rows[0].n}`);
  console.log(`  Banners with imageUrl: ${bImg.rows[0].n}`);

  await c.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
