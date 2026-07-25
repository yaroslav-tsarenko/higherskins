/**
 * Group the existing 14 flat leaf-categories under 8 electronics
 * departments so the header mega-menu has a proper 2-level structure.
 * The Prisma schema stays unchanged — we only insert new parent
 * Category rows and re-point `parentId` on the existing leaves.
 *
 * Departments → children mapping:
 *   Audio & Headphones      ← Headphones, Headsets, Microphones
 *   Laptops & Computers     ← Notebooks, Desktop Computers, CPU
 *   Smartphones & Tablets   ← Smartphones, Tablets
 *   Displays & Monitors     ← Monitors
 *   Gaming & Consoles       ← Consoles
 *   Peripherals             ← Keyboards, Mouse Devices
 *   Cameras & Drones        ← Drones
 *   Printers & Office       ← Printers
 */
import "dotenv/config";
import pg from "pg";

function cuid(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 10);
  return `c${ts}${rand}${Math.random().toString(36).substring(2, 6)}`;
}

const DEPARTMENTS: Array<{
  name: string;
  slug: string;
  sortOrder: number;
  children: string[]; // slugs of existing leaf categories
}> = [
  {
    name: "Audio & Headphones",
    slug: "audio-headphones",
    sortOrder: 10,
    children: ["headphones", "headsets", "microphones"],
  },
  {
    name: "Laptops & Computers",
    slug: "laptops-computers",
    sortOrder: 20,
    children: ["notebooks", "desktop-computers", "cpu"],
  },
  {
    name: "Smartphones & Tablets",
    slug: "smartphones-tablets",
    sortOrder: 30,
    children: ["smartphones", "tablets"],
  },
  {
    name: "Displays & Monitors",
    slug: "displays-monitors",
    sortOrder: 40,
    children: ["monitors"],
  },
  {
    name: "Gaming & Consoles",
    slug: "gaming-consoles",
    sortOrder: 50,
    children: ["consoles"],
  },
  {
    name: "Peripherals",
    slug: "peripherals",
    sortOrder: 60,
    children: ["keyboards", "mouse-devices"],
  },
  {
    name: "Cameras & Drones",
    slug: "cameras-drones",
    sortOrder: 70,
    children: ["drones"],
  },
  {
    name: "Printers & Office",
    slug: "printers-office",
    sortOrder: 80,
    children: ["printers"],
  },
];

async function main() {
  const c = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  const now = new Date().toISOString();
  const slugToId = new Map<string, string>();

  for (const dept of DEPARTMENTS) {
    const id = cuid();
    const res = await c.query(
      `INSERT INTO "Category" (id, name, slug, "parentId", "sortOrder", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, NULL, $4, true, $5, $5)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, "sortOrder" = EXCLUDED."sortOrder"
       RETURNING id`,
      [id, dept.name, dept.slug, dept.sortOrder, now],
    );
    const deptId = res.rows[0].id;
    slugToId.set(dept.slug, deptId);
    console.log(`department: ${dept.slug} (${deptId})`);

    // re-parent children
    for (const childSlug of dept.children) {
      const upd = await c.query(
        `UPDATE "Category" SET "parentId" = $1, "updatedAt" = $2 WHERE slug = $3 RETURNING id, name`,
        [deptId, now, childSlug],
      );
      if (upd.rows.length) {
        console.log(`   → ${upd.rows[0].name} (${childSlug})`);
      } else {
        console.warn(`   ! child slug not found: ${childSlug}`);
      }
    }
  }

  // Also mirror the ProductCategory links: every product currently linked to
  // a leaf category should ALSO be linked to its new department. This makes
  // /catalog/audio-headphones etc. return products right away.
  console.log("\nMirroring product↔category links to departments…");
  for (const dept of DEPARTMENTS) {
    const deptId = slugToId.get(dept.slug);
    if (!deptId) continue;
    const res = await c.query(
      `INSERT INTO "ProductCategory" ("productId", "categoryId")
       SELECT DISTINCT pc."productId", $1
       FROM "ProductCategory" pc
       JOIN "Category" child ON child.id = pc."categoryId"
       WHERE child.slug = ANY($2::text[])
       ON CONFLICT DO NOTHING`,
      [deptId, dept.children],
    );
    console.log(`   ${dept.slug}: +${res.rowCount} product links`);
  }

  console.log("\nDone.");
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
