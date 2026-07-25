/**
 * CS2 skins catalog import.
 *
 * Usage:
 *   npx tsx scripts/import-skins.ts              # full import
 *   npx tsx scripts/import-skins.ts --dry-run    # no writes, just counts
 *   npx tsx scripts/import-skins.ts --limit 50   # import first 50 skins
 */
import "dotenv/config";
import { importSkins } from "@/lib/skins/import";

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) : undefined;

  const result = await importSkins({
    dryRun,
    limit,
    log: (msg) => console.log(`[import] ${msg}`),
  });

  console.log("\nResult:", JSON.stringify(result, null, 2));
  process.exit(result.errorsCount && result.created + result.updated === 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
