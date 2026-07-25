import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fetchSourceSkins, type SourceSkin } from "./source";
import { activePriceProvider, floatForSlot, paintSeedForSlot } from "./pricing";
import {
  exteriorFromLabel,
  type ExteriorCode,
  rarityMeta,
  seededRng,
} from "./shared";

export interface ImportOptions {
  dryRun?: boolean;
  limit?: number; // cap number of skins (testing)
  batchSize?: number;
  log?: (msg: string) => void;
}

export interface ImportResult {
  runId: string | null;
  totalItems: number;
  created: number;
  updated: number;
  skipped: number;
  errorsCount: number;
  listings: number;
  durationMs: number;
}

const KNIFE_CATEGORY = "Knives";
const GLOVES_CATEGORY = "Gloves";

function mapSkin(src: SourceSkin) {
  const category = src.category?.name ?? "Other";
  const isKnife = category === KNIFE_CATEGORY;
  const isGloves = category === GLOVES_CATEGORY;
  return {
    externalId: src.id,
    name: src.name,
    weapon: src.weapon?.name ?? "Unknown",
    category,
    pattern: src.pattern?.name ?? null,
    rarity: src.rarity?.name ?? "Consumer Grade",
    rarityColor: src.rarity?.color ?? rarityMeta(src.rarity?.name ?? "").color,
    collection: src.collections?.[0]?.name ?? null,
    minFloat: src.min_float ?? 0,
    maxFloat: src.max_float ?? 1,
    imageUrl: src.image ?? null,
    hasStatTrak: Boolean(src.stattrak),
    hasSouvenir: Boolean(src.souvenir),
    isKnife,
    isGloves,
    phases: null as Prisma.InputJsonValue | null,
  };
}

// Determine which exteriors this skin can appear in, from source `wears`.
function exteriorsFor(src: SourceSkin): ExteriorCode[] {
  const fromWears = (src.wears ?? [])
    .map((w) => exteriorFromLabel(w.name))
    .filter((c): c is ExteriorCode => c !== "NA");
  if (fromWears.length) return [...new Set(fromWears)];
  return ["NA"]; // vanilla knives, gloves without wear, etc.
}

interface DerivedListing {
  marketHashName: string;
  exterior: ExteriorCode;
  isStatTrak: boolean;
  isSouvenir: boolean;
  float: number | null;
  paintSeed: number | null;
  price: number;
  steamPrice: number;
  discountPct: number;
  imageUrl: string | null;
}

function marketHashName(
  baseName: string,
  exterior: ExteriorCode,
  exteriorLabel: string | null,
  stattrak: boolean,
  souvenir: boolean,
): string {
  const prefix = stattrak ? "StatTrak™ " : souvenir ? "Souvenir " : "";
  const suffix = exterior === "NA" ? "" : ` (${exteriorLabel})`;
  return `${prefix}${baseName}${suffix}`;
}

const EXTERIOR_LABELS: Record<ExteriorCode, string | null> = {
  FN: "Factory New",
  MW: "Minimal Wear",
  FT: "Field-Tested",
  WW: "Well-Worn",
  BS: "Battle-Scarred",
  NA: null,
};

// Build the derived listings for one skin (deterministic → idempotent).
function buildListings(src: SourceSkin, mapped: ReturnType<typeof mapSkin>): DerivedListing[] {
  const exteriors = exteriorsFor(src);
  const listings: DerivedListing[] = [];
  const rng = seededRng(`${src.id}:count`);

  for (const exterior of exteriors) {
    // 1–3 offers per exterior.
    const count = exterior === "NA" ? 2 : 1 + Math.floor(rng() * 3);
    for (let slot = 0; slot < count; slot++) {
      const float =
        exterior === "NA" ? null : floatForSlot(mapped.externalId, exterior, slot);
      const quote = activePriceProvider.quote({
        externalId: `${mapped.externalId}:${slot}`,
        rarity: mapped.rarity,
        exterior,
        isStatTrak: false,
        isSouvenir: false,
        float: float ?? 0,
      });
      listings.push({
        marketHashName: marketHashName(
          mapped.name,
          exterior,
          EXTERIOR_LABELS[exterior],
          false,
          false,
        ),
        exterior,
        isStatTrak: false,
        isSouvenir: false,
        float,
        paintSeed: exterior === "NA" ? null : paintSeedForSlot(mapped.externalId, slot),
        price: quote.price,
        steamPrice: quote.steamPrice,
        discountPct: quote.discountPct,
        imageUrl: mapped.imageUrl,
      });
    }

    // One StatTrak offer for lower-wear exteriors when available.
    if (mapped.hasStatTrak && (exterior === "FN" || exterior === "MW" || exterior === "FT")) {
      const float = floatForSlot(mapped.externalId, exterior, 9);
      const quote = activePriceProvider.quote({
        externalId: `${mapped.externalId}:st`,
        rarity: mapped.rarity,
        exterior,
        isStatTrak: true,
        isSouvenir: false,
        float,
      });
      listings.push({
        marketHashName: marketHashName(mapped.name, exterior, EXTERIOR_LABELS[exterior], true, false),
        exterior,
        isStatTrak: true,
        isSouvenir: false,
        float,
        paintSeed: paintSeedForSlot(mapped.externalId, 9),
        price: quote.price,
        steamPrice: quote.steamPrice,
        discountPct: quote.discountPct,
        imageUrl: mapped.imageUrl,
      });
    }
  }
  return listings;
}

export async function importSkins(opts: ImportOptions = {}): Promise<ImportResult> {
  const { dryRun = false, limit, batchSize = 40, log = () => {} } = opts;
  const start = Date.now();

  log(`Fetching source catalog…`);
  let source = await fetchSourceSkins();
  // Keep only real skins (skip null-named / placeholder entries).
  source = source.filter((s) => s.id && s.name);
  if (limit) source = source.slice(0, limit);
  log(`Fetched ${source.length} skins.`);

  const run = dryRun
    ? null
    : await prisma.skinImportRun.create({
        data: { source: "bymykel", dryRun, totalItems: source.length, status: "running" },
      });

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let listingCount = 0;
  const errors: { externalId: string; error: string }[] = [];

  for (let i = 0; i < source.length; i += batchSize) {
    const batch = source.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (src) => {
        try {
          const mapped = mapSkin(src);
          const listings = buildListings(src, mapped);
          const prices = listings.map((l) => l.price);
          const lowestPrice = prices.length ? Math.min(...prices) : null;

          listingCount += listings.length;

          if (dryRun) {
            skipped++;
            return;
          }

          const existing = await prisma.skin.findUnique({
            where: { externalId: mapped.externalId },
            select: { id: true },
          });

          const skin = await prisma.skin.upsert({
            where: { externalId: mapped.externalId },
            create: {
              ...mapped,
              phases: mapped.phases ?? undefined,
              lowestPrice: lowestPrice ?? undefined,
              listingCount: listings.length,
            },
            update: {
              ...mapped,
              phases: mapped.phases ?? undefined,
              lowestPrice: lowestPrice ?? undefined,
              listingCount: listings.length,
            },
            select: { id: true },
          });

          // Replace derived listings idempotently.
          await prisma.skinListing.deleteMany({ where: { skinId: skin.id } });
          if (listings.length) {
            await prisma.skinListing.createMany({
              data: listings.map((l) => ({
                skinId: skin.id,
                marketHashName: l.marketHashName,
                exterior: l.exterior,
                isStatTrak: l.isStatTrak,
                isSouvenir: l.isSouvenir,
                float: l.float,
                paintSeed: l.paintSeed,
                price: l.price,
                steamPrice: l.steamPrice,
                discountPct: l.discountPct,
                imageUrl: l.imageUrl,
                currency: "USD",
                market: "higherskins",
                status: "available",
              })),
            });
          }

          if (existing) updated++;
          else created++;
        } catch (err) {
          errors.push({
            externalId: src.id,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }),
    );
    log(`Processed ${Math.min(i + batchSize, source.length)}/${source.length}…`);
  }

  const result: ImportResult = {
    runId: run?.id ?? null,
    totalItems: source.length,
    created,
    updated,
    skipped,
    errorsCount: errors.length,
    listings: listingCount,
    durationMs: Date.now() - start,
  };

  if (run) {
    await prisma.skinImportRun.update({
      where: { id: run.id },
      data: {
        status: errors.length && created + updated === 0 ? "failed" : "completed",
        created,
        updated,
        skipped,
        errorsCount: errors.length,
        errorLog: errors.length ? (errors.slice(0, 100) as Prisma.InputJsonValue) : undefined,
        finishedAt: new Date(),
      },
    });
  }

  log(
    `Done in ${result.durationMs}ms — created ${created}, updated ${updated}, listings ${listingCount}, errors ${errors.length}.`,
  );
  return result;
}
