import "dotenv/config";
import fs from "fs";
import path from "path";
import { parse } from "papaparse";
import pg from "pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DIRECT_URL / DATABASE_URL not set in .env");

const CSV_PATH = path.resolve(
  __dirname,
  "../data/wc-product-export-6-7-2026-1783365566143.csv",
);

let client: pg.Client;

async function connect() {
  client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  client.on("error", () => {});
  await client.connect();
}

async function reconnect() {
  try { await client.end(); } catch {}
  await connect();
}

async function query(sql: string, params?: unknown[]) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await client.query(sql, params);
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (
        msg.includes("terminated") ||
        msg.includes("Connection") ||
        msg.includes("timeout") ||
        err?.code === "EPIPE" ||
        err?.code === "ECONNRESET"
      ) {
        console.log(`\n  reconnecting (attempt ${attempt + 1})…`);
        await reconnect();
        continue;
      }
      throw err;
    }
  }
  throw new Error("query failed after retries");
}

function cuid(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 10);
  return `c${ts}${rand}${Math.random().toString(36).substring(2, 6)}`;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 190);
}

function parseNum(v: string | undefined): number | null {
  if (!v) return null;
  const s = v.trim();
  if (!s) return null;
  const n = parseFloat(s.replace(/,/g, "."));
  return Number.isFinite(n) ? n : null;
}

function parseInteger(v: string | undefined): number | null {
  if (!v) return null;
  const n = parseInt(v.trim(), 10);
  return Number.isFinite(n) ? n : null;
}

function splitList(v: string | undefined): string[] {
  if (!v) return [];
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

function stripWCEscapes(s: string | undefined): string | null {
  if (!s) return null;
  const trimmed = s.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
}

interface Row {
  ID: string;
  Type: string;
  SKU: string;
  Name: string;
  Published: string;
  IsFeatured: string;
  ShortDescription: string;
  Description: string;
  InStock: string;
  Stock: string;
  Weight: string;
  SalePrice: string;
  RegularPrice: string;
  Categories: string;
  Tags: string;
  Images: string;
  Parent: string;
  Brands: string;
  Gtin: string;
  Attr1Name: string;
  Attr1Value: string;
  Attr2Name: string;
  Attr2Value: string;
}

function toRow(raw: Record<string, string>): Row {
  return {
    ID: (raw.ID ?? "").trim(),
    Type: (raw.Type ?? "").trim(),
    SKU: (raw.SKU ?? "").trim(),
    Name: (raw.Name ?? "").trim(),
    Published: (raw.Published ?? "").trim(),
    IsFeatured: (raw["Is featured?"] ?? "").trim(),
    ShortDescription: raw["Short description"] ?? "",
    Description: raw.Description ?? "",
    InStock: (raw["In stock?"] ?? "").trim(),
    Stock: (raw.Stock ?? "").trim(),
    Weight: (raw["Weight (kg)"] ?? "").trim(),
    SalePrice: (raw["Sale price"] ?? "").trim(),
    RegularPrice: (raw["Regular price"] ?? "").trim(),
    Categories: raw.Categories ?? "",
    Tags: raw.Tags ?? "",
    Images: raw.Images ?? "",
    Parent: (raw.Parent ?? "").trim(),
    Brands: (raw.Brands ?? "").trim(),
    Gtin: (raw["GTIN, UPC, EAN, or ISBN"] ?? "").trim(),
    Attr1Name: (raw["Attribute 1 name"] ?? "").trim(),
    Attr1Value: (raw["Attribute 1 value(s)"] ?? "").trim(),
    Attr2Name: (raw["Attribute 2 name"] ?? "").trim(),
    Attr2Value: (raw["Attribute 2 value(s)"] ?? "").trim(),
  };
}

async function main() {
  console.log(`Reading ${CSV_PATH}`);
  const csvText = fs.readFileSync(CSV_PATH, "utf-8");
  const parsed = parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors?.length) {
    console.warn(`CSV parse errors: ${parsed.errors.length} (showing first 3)`);
    for (const e of parsed.errors.slice(0, 3)) console.warn("  ", e);
  }
  const rows: Row[] = parsed.data.map(toRow);
  console.log(`Parsed ${rows.length} rows`);

  await connect();

  // Phase 1: wipe product-related tables
  console.log("Wiping existing product data…");
  await query('DELETE FROM "OrderItem"');
  await query('DELETE FROM "ProductCategory"');
  await query('DELETE FROM "ProductImage"');
  await query('DELETE FROM "ProductVariant"');
  await query('DELETE FROM "Review"');
  await query('DELETE FROM "WishlistItem"');
  await query('DELETE FROM "Product"');
  await query('DELETE FROM "Category"');
  console.log("  done");

  // Phase 2: build category tree from all rows
  console.log("Building categories…");
  interface CatEntry { name: string; slug: string; parentSlug: string | null; depth: number }
  const catMap = new Map<string, CatEntry>();

  for (const r of rows) {
    for (const catPath of splitList(r.Categories)) {
      const parts = catPath.split(">").map((p) => p.trim()).filter(Boolean);
      let parentSlug: string | null = null;
      for (let i = 0; i < parts.length; i++) {
        const slug = slugify(parts.slice(0, i + 1).join("-"));
        if (!slug) continue;
        if (!catMap.has(slug)) {
          catMap.set(slug, { name: parts[i], slug, parentSlug, depth: i });
        }
        parentSlug = slug;
      }
    }
  }

  // Sort by depth so parents insert first
  const catEntries = [...catMap.values()].sort((a, b) => a.depth - b.depth);
  const slugToCatId = new Map<string, string>();
  const now = new Date().toISOString();

  for (const c of catEntries) {
    const id = cuid();
    const parentId = c.parentSlug ? slugToCatId.get(c.parentSlug) ?? null : null;
    const res = await query(
      `INSERT INTO "Category" (id, name, slug, "parentId", "sortOrder", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, 0, true, $5, $5)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, "parentId" = EXCLUDED."parentId"
       RETURNING id`,
      [id, c.name, c.slug, parentId, now],
    );
    slugToCatId.set(c.slug, res.rows[0].id);
  }
  console.log(`  ${slugToCatId.size} categories`);

  // Phase 3: group rows into parents + their variations
  // - variable: has ID, no SKU expected — id2parent[ID] = row
  // - variation: has Parent = "id:NNN" or SKU
  // - simple: standalone product
  const parents = new Map<string, Row>();      // wcId -> row
  const variations = new Map<string, Row[]>(); // parentWcId -> variations
  const simples: Row[] = [];

  for (const r of rows) {
    if (!r.Type) continue;
    if (r.Type === "variable") {
      if (r.ID) parents.set(r.ID, r);
    } else if (r.Type === "variation") {
      // Parent is like "id:738"
      const m = r.Parent.match(/^id:(\d+)$/);
      const pid = m?.[1] ?? "";
      if (!pid) continue;
      if (!variations.has(pid)) variations.set(pid, []);
      variations.get(pid)!.push(r);
    } else if (r.Type === "simple" || r.Type === "external" || r.Type === "grouped") {
      simples.push(r);
    }
  }

  console.log(`  parents: ${parents.size}, variations: ${[...variations.values()].reduce((a, v) => a + v.length, 0)}, simples: ${simples.length}`);

  // Phase 4: prepare Product rows
  interface ProductRow {
    id: string;
    wcId: string;
    name: string;
    slug: string;
    sku: string;
    description: string | null;
    shortDescription: string | null;
    price: number;
    comparePrice: number | null;
    quantity: number;
    weight: number | null;
    status: "ACTIVE" | "DRAFT";
    isFeatured: boolean;
    brand: string | null;
    gtin: string | null;
    ean: string | null;
    metadata: Record<string, unknown> | null;
    categories: string[]; // full paths, as they appear in CSV
    images: string[];
    variantRows: Row[];
  }

  const usedSlugs = new Set<string>();
  const usedSkus = new Set<string>();
  function uniqueSlug(base: string): string {
    let slug = base || "product";
    let i = 1;
    while (usedSlugs.has(slug)) { slug = `${base}-${i++}`; }
    usedSlugs.add(slug);
    return slug;
  }
  function uniqueSku(base: string): string {
    let sku = base;
    let i = 1;
    while (usedSkus.has(sku)) { sku = `${base}-${i++}`; }
    usedSkus.add(sku);
    return sku;
  }

  function priceFromVariations(vs: Row[]): { price: number; compare: number | null } {
    let min = Number.POSITIVE_INFINITY;
    let anySale = false;
    let saleMin = Number.POSITIVE_INFINITY;
    for (const v of vs) {
      const reg = parseNum(v.RegularPrice);
      const sale = parseNum(v.SalePrice);
      if (reg !== null && reg > 0 && reg < min) min = reg;
      if (sale !== null && sale > 0) { anySale = true; if (sale < saleMin) saleMin = sale; }
    }
    if (!Number.isFinite(min)) min = 0;
    if (anySale && Number.isFinite(saleMin) && saleMin < min) {
      return { price: saleMin, compare: min };
    }
    return { price: min, compare: null };
  }

  const products: ProductRow[] = [];

  // Variable parents
  for (const [wcId, r] of parents) {
    const vs = variations.get(wcId) ?? [];
    const { price, compare } = priceFromVariations(vs);
    // fallback price on parent regular
    const parentReg = parseNum(r.RegularPrice);
    const finalPrice = price > 0 ? price : (parentReg ?? 0);

    const baseSku = r.SKU || `WC-${wcId}`;
    const baseSlug = slugify(r.Name);

    products.push({
      id: cuid(),
      wcId,
      name: r.Name,
      slug: uniqueSlug(baseSlug),
      sku: uniqueSku(baseSku),
      description: stripWCEscapes(r.Description),
      shortDescription: stripWCEscapes(r.ShortDescription),
      price: finalPrice,
      comparePrice: compare,
      // WC export has empty Stock for POD-style products — default to a high
      // number and disable inventory tracking so items are always buyable.
      quantity: (parseInteger(r.Stock) ?? vs.reduce((a, v) => a + (parseInteger(v.Stock) ?? 0), 0)) || 999,
      weight: parseNum(r.Weight),
      status: r.Published === "1" ? "ACTIVE" : "DRAFT",
      isFeatured: r.IsFeatured === "1",
      brand: r.Brands || null,
      gtin: r.Gtin || null,
      ean: /^\d{13}$/.test(r.Gtin) ? r.Gtin : null,
      metadata: r.Tags ? { tags: splitList(r.Tags) } : null,
      categories: splitList(r.Categories),
      images: splitList(r.Images),
      variantRows: vs,
    });
  }

  // Simple products
  for (const r of simples) {
    if (!r.Name) continue;
    const reg = parseNum(r.RegularPrice) ?? 0;
    const sale = parseNum(r.SalePrice);
    const useSale = sale !== null && sale > 0 && sale < reg;

    const baseSku = r.SKU || `WC-${r.ID}`;
    const baseSlug = slugify(r.Name);

    products.push({
      id: cuid(),
      wcId: r.ID,
      name: r.Name,
      slug: uniqueSlug(baseSlug),
      sku: uniqueSku(baseSku),
      description: stripWCEscapes(r.Description),
      shortDescription: stripWCEscapes(r.ShortDescription),
      price: useSale ? sale! : reg,
      comparePrice: useSale ? reg : null,
      quantity: parseInteger(r.Stock) ?? 999,
      weight: parseNum(r.Weight),
      status: r.Published === "1" ? "ACTIVE" : "DRAFT",
      isFeatured: r.IsFeatured === "1",
      brand: r.Brands || null,
      gtin: r.Gtin || null,
      ean: /^\d{13}$/.test(r.Gtin) ? r.Gtin : null,
      metadata: r.Tags ? { tags: splitList(r.Tags) } : null,
      categories: splitList(r.Categories),
      images: splitList(r.Images),
      variantRows: [],
    });
  }

  console.log(`Prepared ${products.length} products`);

  // Phase 5: batch-insert products
  console.log("Inserting products…");
  const BATCH = 100;
  let inserted = 0;

  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH);
    const COLS = 17;
    const values: unknown[] = [];
    const placeholders: string[] = [];

    batch.forEach((p, j) => {
      const off = j * COLS;
      placeholders.push(
        `($${off + 1},$${off + 2},$${off + 3},$${off + 4},$${off + 5},$${off + 6},$${off + 7},$${off + 8},$${off + 9},$${off + 10},$${off + 11},$${off + 12},$${off + 13},$${off + 14},$${off + 15},$${off + 16}::jsonb,$${off + 17},$${off + 17},false)`,
      );
      values.push(
        p.id, p.name, p.slug, p.sku, p.price, p.comparePrice,
        p.quantity, p.description, p.shortDescription, p.brand,
        p.weight, p.status, p.isFeatured, p.gtin, p.ean,
        p.metadata ? JSON.stringify(p.metadata) : null,
        now,
      );
    });

    try {
      await query(
        `INSERT INTO "Product"
          (id, name, slug, sku, price, "comparePrice", quantity, description, "shortDescription", brand, weight, status, "isFeatured", gtin, ean, metadata, "createdAt", "updatedAt", "trackInventory")
         VALUES ${placeholders.join(",")}
         ON CONFLICT (sku) DO NOTHING`,
        values,
      );
      inserted += batch.length;
    } catch (err) {
      console.error("\nbatch insert failed, falling back to single-row inserts:", err);
      for (const p of batch) {
        try {
          await query(
            `INSERT INTO "Product"
              (id, name, slug, sku, price, "comparePrice", quantity, description, "shortDescription", brand, weight, status, "isFeatured", gtin, ean, metadata, "createdAt", "updatedAt", "trackInventory")
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17,$17,false)
             ON CONFLICT (sku) DO NOTHING`,
            [
              p.id, p.name, p.slug, p.sku, p.price, p.comparePrice,
              p.quantity, p.description, p.shortDescription, p.brand,
              p.weight, p.status, p.isFeatured, p.gtin, p.ean,
              p.metadata ? JSON.stringify(p.metadata) : null,
              now,
            ],
          );
          inserted++;
        } catch (e2) {
          console.error(`  failed sku=${p.sku}: ${e2 instanceof Error ? e2.message : e2}`);
        }
      }
    }

    process.stdout.write(`\r  products: ${Math.min(i + BATCH, products.length)}/${products.length}`);
  }
  console.log(`\n  inserted: ${inserted}`);

  // Phase 6: fetch back product ids by sku
  const idRes = await query('SELECT id, sku FROM "Product"');
  const skuToId = new Map<string, string>(idRes.rows.map((r: any) => [r.sku as string, r.id as string]));

  // Phase 7: variants
  console.log("Inserting variants…");
  interface VariantInsert {
    id: string; name: string; sku: string; price: number | null; quantity: number;
    options: Record<string, string>; productId: string;
  }
  const variantInserts: VariantInsert[] = [];
  const variantSkuSeen = new Set<string>();

  for (const p of products) {
    if (p.variantRows.length === 0) continue;
    const productId = skuToId.get(p.sku);
    if (!productId) continue;

    for (const v of p.variantRows) {
      const opts: Record<string, string> = {};
      if (v.Attr1Name && v.Attr1Value) opts[v.Attr1Name] = v.Attr1Value;
      if (v.Attr2Name && v.Attr2Value) opts[v.Attr2Name] = v.Attr2Value;

      const label = Object.values(opts).join(" / ") || "Default";
      const reg = parseNum(v.RegularPrice);
      const sale = parseNum(v.SalePrice);
      const useSale = sale !== null && sale > 0 && (reg === null || sale < reg);
      const price = useSale ? sale! : reg;

      let sku = v.SKU || `${p.sku}-${slugify(label) || v.ID}`;
      if (variantSkuSeen.has(sku)) {
        let i = 1;
        while (variantSkuSeen.has(`${sku}-${i}`)) i++;
        sku = `${sku}-${i}`;
      }
      variantSkuSeen.add(sku);

      variantInserts.push({
        id: cuid(),
        name: label,
        sku,
        price,
        quantity: parseInteger(v.Stock) ?? 999,
        options: opts,
        productId,
      });
    }
  }

  for (let i = 0; i < variantInserts.length; i += 200) {
    const batch = variantInserts.slice(i, i + 200);
    const values: unknown[] = [];
    const placeholders: string[] = [];
    batch.forEach((v, j) => {
      const off = j * 7;
      placeholders.push(`($${off + 1},$${off + 2},$${off + 3},$${off + 4},$${off + 5},$${off + 6}::jsonb,$${off + 7})`);
      values.push(v.id, v.name, v.sku, v.price, v.quantity, JSON.stringify(v.options), v.productId);
    });
    try {
      await query(
        `INSERT INTO "ProductVariant" (id, name, sku, price, quantity, options, "productId")
         VALUES ${placeholders.join(",")}
         ON CONFLICT (sku) DO NOTHING`,
        values,
      );
    } catch (err) {
      console.error("\nvariant batch failed, retrying one-by-one:", err);
      for (const v of batch) {
        try {
          await query(
            `INSERT INTO "ProductVariant" (id, name, sku, price, quantity, options, "productId")
             VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7)
             ON CONFLICT (sku) DO NOTHING`,
            [v.id, v.name, v.sku, v.price, v.quantity, JSON.stringify(v.options), v.productId],
          );
        } catch (e2) {
          console.error(`  failed variant sku=${v.sku}: ${e2 instanceof Error ? e2.message : e2}`);
        }
      }
    }
    process.stdout.write(`\r  variants: ${Math.min(i + 200, variantInserts.length)}/${variantInserts.length}`);
  }
  console.log(`\n  variants: ${variantInserts.length}`);

  // Phase 8: images
  console.log("Inserting images…");
  interface ImageInsert { id: string; url: string; alt: string; sortOrder: number; productId: string }
  const imageInserts: ImageInsert[] = [];
  for (const p of products) {
    const productId = skuToId.get(p.sku);
    if (!productId) continue;
    p.images.forEach((url, idx) => {
      if (!url) return;
      imageInserts.push({ id: cuid(), url, alt: p.name, sortOrder: idx, productId });
    });
  }

  for (let i = 0; i < imageInserts.length; i += 300) {
    const batch = imageInserts.slice(i, i + 300);
    const values: unknown[] = [];
    const placeholders: string[] = [];
    batch.forEach((img, j) => {
      const off = j * 5;
      placeholders.push(`($${off + 1},$${off + 2},$${off + 3},$${off + 4},$${off + 5})`);
      values.push(img.id, img.url, img.alt, img.sortOrder, img.productId);
    });
    await query(
      `INSERT INTO "ProductImage" (id, url, alt, "sortOrder", "productId")
       VALUES ${placeholders.join(",")}`,
      values,
    );
    process.stdout.write(`\r  images: ${Math.min(i + 300, imageInserts.length)}/${imageInserts.length}`);
  }
  console.log(`\n  images: ${imageInserts.length}`);

  // Phase 9: category links
  console.log("Linking categories…");
  const catLinks: { productId: string; categoryId: string }[] = [];
  const seenLinks = new Set<string>();
  for (const p of products) {
    const productId = skuToId.get(p.sku);
    if (!productId) continue;
    for (const catPath of p.categories) {
      const parts = catPath.split(">").map((s) => s.trim()).filter(Boolean);
      if (parts.length === 0) continue;
      // link to deepest node
      const slug = slugify(parts.join("-"));
      const categoryId = slugToCatId.get(slug);
      if (!categoryId) continue;
      const key = `${productId}:${categoryId}`;
      if (seenLinks.has(key)) continue;
      seenLinks.add(key);
      catLinks.push({ productId, categoryId });
    }
  }

  for (let i = 0; i < catLinks.length; i += 500) {
    const batch = catLinks.slice(i, i + 500);
    const values: unknown[] = [];
    const placeholders: string[] = [];
    batch.forEach((l, j) => {
      placeholders.push(`($${j * 2 + 1},$${j * 2 + 2})`);
      values.push(l.productId, l.categoryId);
    });
    await query(
      `INSERT INTO "ProductCategory" ("productId", "categoryId")
       VALUES ${placeholders.join(",")}
       ON CONFLICT DO NOTHING`,
      values,
    );
    process.stdout.write(`\r  cat links: ${Math.min(i + 500, catLinks.length)}/${catLinks.length}`);
  }
  console.log(`\n  category links: ${catLinks.length}`);

  // Summary
  const [pc, cc, ic, vc, lc] = await Promise.all([
    query('SELECT count(*)::int AS n FROM "Product"'),
    query('SELECT count(*)::int AS n FROM "Category"'),
    query('SELECT count(*)::int AS n FROM "ProductImage"'),
    query('SELECT count(*)::int AS n FROM "ProductVariant"'),
    query('SELECT count(*)::int AS n FROM "ProductCategory"'),
  ]);
  console.log("\nDone.");
  console.log(`  Products:        ${pc.rows[0].n}`);
  console.log(`  Categories:      ${cc.rows[0].n}`);
  console.log(`  Images:          ${ic.rows[0].n}`);
  console.log(`  Variants:        ${vc.rows[0].n}`);
  console.log(`  Category links:  ${lc.rows[0].n}`);

  await client.end();
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
