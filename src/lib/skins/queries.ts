import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildPriceHistory } from "./pricing";
import type { ExteriorCode } from "./shared";

export interface CatalogFilters {
  search?: string;
  weapons?: string[];
  categories?: string[];
  rarities?: string[];
  exteriors?: ExteriorCode[];
  priceMin?: number;
  priceMax?: number;
  floatMin?: number;
  floatMax?: number;
  statTrak?: boolean;
  souvenir?: boolean;
  sort?: string;
  page?: number;
  perPage?: number;
}

export interface CatalogItem {
  listingId: string;
  skinId: string;
  name: string;
  weapon: string;
  category: string;
  rarity: string;
  rarityColor: string;
  exterior: ExteriorCode;
  float: number | null;
  paintSeed: number | null;
  price: number;
  steamPrice: number | null;
  discountPct: number | null;
  isStatTrak: boolean;
  isSouvenir: boolean;
  imageUrl: string | null;
}

export interface CatalogResult {
  items: CatalogItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

const SORT_MAP: Record<string, Prisma.SkinListingOrderByWithRelationInput[]> = {
  price_asc: [{ price: "asc" }],
  price_desc: [{ price: "desc" }],
  float_asc: [{ float: "asc" }],
  float_desc: [{ float: "desc" }],
  discount: [{ discountPct: "desc" }],
  newest: [{ createdAt: "desc" }],
};

export function buildListingWhere(f: CatalogFilters): Prisma.SkinListingWhereInput {
  const skin: Prisma.SkinWhereInput = {};
  if (f.search) skin.name = { contains: f.search, mode: "insensitive" };
  if (f.weapons?.length) skin.weapon = { in: f.weapons };
  if (f.categories?.length) skin.category = { in: f.categories };
  if (f.rarities?.length) skin.rarity = { in: f.rarities };

  const where: Prisma.SkinListingWhereInput = {
    status: "available",
  };
  if (Object.keys(skin).length) where.skin = skin;
  if (f.exteriors?.length) where.exterior = { in: f.exteriors };
  if (f.statTrak) where.isStatTrak = true;
  if (f.souvenir) where.isSouvenir = true;

  if (f.priceMin != null || f.priceMax != null) {
    where.price = {};
    if (f.priceMin != null) where.price.gte = f.priceMin;
    if (f.priceMax != null) where.price.lte = f.priceMax;
  }
  if (f.floatMin != null || f.floatMax != null) {
    where.float = {};
    if (f.floatMin != null) where.float.gte = f.floatMin;
    if (f.floatMax != null) where.float.lte = f.floatMax;
  }
  return where;
}

export async function queryCatalog(f: CatalogFilters): Promise<CatalogResult> {
  const page = Math.max(1, f.page ?? 1);
  const perPage = Math.min(96, Math.max(12, f.perPage ?? 48));
  const where = buildListingWhere(f);
  const orderBy = SORT_MAP[f.sort ?? "price_asc"] ?? SORT_MAP.price_asc;

  const [rows, total] = await Promise.all([
    prisma.skinListing.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        skinId: true,
        exterior: true,
        float: true,
        paintSeed: true,
        price: true,
        steamPrice: true,
        discountPct: true,
        isStatTrak: true,
        isSouvenir: true,
        imageUrl: true,
        skin: {
          select: {
            name: true,
            weapon: true,
            category: true,
            rarity: true,
            rarityColor: true,
            imageUrl: true,
          },
        },
      },
    }),
    prisma.skinListing.count({ where }),
  ]);

  const items: CatalogItem[] = rows.map((r) => ({
    listingId: r.id,
    skinId: r.skinId,
    name: r.skin.name,
    weapon: r.skin.weapon,
    category: r.skin.category,
    rarity: r.skin.rarity,
    rarityColor: r.skin.rarityColor,
    exterior: r.exterior as ExteriorCode,
    float: r.float,
    paintSeed: r.paintSeed,
    price: Number(r.price),
    steamPrice: r.steamPrice != null ? Number(r.steamPrice) : null,
    discountPct: r.discountPct,
    isStatTrak: r.isStatTrak,
    isSouvenir: r.isSouvenir,
    imageUrl: r.imageUrl ?? r.skin.imageUrl,
  }));

  return {
    items,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

// Distinct facet values for building the filter sidebar.
export async function getCatalogFacets() {
  const [weapons, categories] = await Promise.all([
    prisma.skin.findMany({
      distinct: ["weapon"],
      select: { weapon: true, category: true },
      orderBy: { weapon: "asc" },
    }),
    prisma.skin.findMany({
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    }),
  ]);
  return {
    weapons: weapons.map((w) => ({ weapon: w.weapon, category: w.category })),
    categories: categories.map((c) => c.category),
  };
}

export interface MarketStats {
  totalListings: number;
  totalSkins: number;
  avgDiscountPct: number;
  marketValue: number;
}

// Aggregate marketplace figures for the homepage stats strip & analytics page.
export async function getMarketStats(): Promise<MarketStats> {
  const [totalListings, totalSkins, agg, discountAgg] = await Promise.all([
    prisma.skinListing.count({ where: { status: "available" } }),
    prisma.skin.count(),
    prisma.skinListing.aggregate({
      where: { status: "available" },
      _sum: { price: true },
    }),
    prisma.skinListing.aggregate({
      where: { status: "available", discountPct: { gt: 0 } },
      _avg: { discountPct: true },
    }),
  ]);
  return {
    totalListings,
    totalSkins,
    avgDiscountPct: discountAgg._avg.discountPct ?? 0,
    marketValue: Number(agg._sum.price ?? 0),
  };
}

export interface SkinSuggestion {
  id: string;
  name: string;
  weapon: string;
  category: string;
  rarityColor: string;
  imageUrl: string | null;
  lowestPrice: number | null;
}

// Prefix/substring search over skin names for the header autocomplete.
export async function getSkinSuggestions(query: string, limit = 8): Promise<SkinSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const rows = await prisma.skin.findMany({
    where: {
      name: { contains: q, mode: "insensitive" },
      listingCount: { gt: 0 },
    },
    orderBy: [{ listingCount: "desc" }, { lowestPrice: "asc" }],
    take: Math.min(12, Math.max(1, limit)),
    select: {
      id: true,
      name: true,
      weapon: true,
      category: true,
      rarityColor: true,
      imageUrl: true,
      lowestPrice: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    weapon: r.weapon,
    category: r.category,
    rarityColor: r.rarityColor,
    imageUrl: r.imageUrl,
    lowestPrice: r.lowestPrice != null ? Number(r.lowestPrice) : null,
  }));
}

// Full skin detail + its listings for the item page.
export async function getSkinDetail(skinId: string) {
  const skin = await prisma.skin.findUnique({
    where: { id: skinId },
    include: {
      listings: {
        where: { status: "available" },
        orderBy: { price: "asc" },
      },
    },
  });
  return skin;
}

export interface SkinListingView {
  id: string;
  exterior: ExteriorCode;
  float: number | null;
  paintSeed: number | null;
  phase: string | null;
  isStatTrak: boolean;
  isSouvenir: boolean;
  stickers: unknown;
  inspectLink: string | null;
  imageUrl: string | null;
  price: number;
  steamPrice: number | null;
  discountPct: number | null;
  market: string;
}

export interface SkinPageData {
  id: string;
  externalId: string;
  name: string;
  weapon: string;
  category: string;
  rarity: string;
  rarityColor: string;
  collection: string | null;
  pattern: string | null;
  minFloat: number | null;
  maxFloat: number | null;
  imageUrl: string | null;
  isKnife: boolean;
  isGloves: boolean;
  lowestPrice: number | null;
  listings: SkinListingView[];
}

// Clean, client-serializable view of a skin + its listings.
export async function getSkinPageData(skinId: string): Promise<SkinPageData | null> {
  const skin = await getSkinDetail(skinId);
  if (!skin) return null;

  return {
    id: skin.id,
    externalId: skin.externalId,
    name: skin.name,
    weapon: skin.weapon,
    category: skin.category,
    rarity: skin.rarity,
    rarityColor: skin.rarityColor,
    collection: skin.collection,
    pattern: skin.pattern,
    minFloat: skin.minFloat,
    maxFloat: skin.maxFloat,
    imageUrl: skin.imageUrl,
    isKnife: skin.isKnife,
    isGloves: skin.isGloves,
    lowestPrice: skin.lowestPrice != null ? Number(skin.lowestPrice) : null,
    listings: skin.listings.map((l) => ({
      id: l.id,
      exterior: l.exterior as ExteriorCode,
      float: l.float,
      paintSeed: l.paintSeed,
      phase: l.phase,
      isStatTrak: l.isStatTrak,
      isSouvenir: l.isSouvenir,
      stickers: l.stickers,
      inspectLink: l.inspectLink,
      imageUrl: l.imageUrl ?? skin.imageUrl,
      price: Number(l.price),
      steamPrice: l.steamPrice != null ? Number(l.steamPrice) : null,
      discountPct: l.discountPct,
      market: l.market,
    })),
  };
}

export interface TickerListing {
  id: string;
  skinId: string;
  name: string;
  weapon: string;
  price: number;
  discountPct: number | null;
  rarityColor: string;
  imageUrl: string | null;
}

// Newest available listings — powers the live market ticker on the homepage.
export async function getRecentListings(limit = 18): Promise<TickerListing[]> {
  const rows = await prisma.skinListing.findMany({
    where: { status: "available" },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      price: true,
      discountPct: true,
      imageUrl: true,
      skin: { select: { id: true, name: true, weapon: true, rarityColor: true, imageUrl: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    skinId: r.skin.id,
    name: r.skin.name,
    weapon: r.skin.weapon,
    price: Number(r.price),
    discountPct: r.discountPct,
    rarityColor: r.skin.rarityColor,
    imageUrl: r.imageUrl ?? r.skin.imageUrl,
  }));
}

export interface CategoryShowcase {
  category: string;
  count: number;
  items: CatalogItem[];
}

// Top categories by tradable-skin count, each with a handful of best-value
// listings — powers the tabbed showcase on the homepage.
export async function getCategoryShowcase(
  perCategory = 5,
  maxCategories = 5,
): Promise<CategoryShowcase[]> {
  const groups = await prisma.skin.groupBy({
    by: ["category"],
    where: { listingCount: { gt: 0 } },
    _count: { _all: true },
    orderBy: { _count: { category: "desc" } },
    take: maxCategories,
  });

  return Promise.all(
    groups.map(async (g) => ({
      category: g.category,
      count: g._count._all,
      items: (await queryCatalog({ categories: [g.category], sort: "discount" })).items.slice(
        0,
        perCategory,
      ),
    })),
  );
}

export interface PriceMover {
  skinId: string;
  name: string;
  weapon: string;
  rarityColor: string;
  imageUrl: string | null;
  price: number;
  changePct: number;
  spark: number[];
}

const MOVER_WINDOW_DAYS = 30;
const MOVER_LOOKBACK_DAYS = 7;

// 7-day price movement for the most liquid skins, with a sparkline series.
export async function getTopMovers(limit = 6): Promise<{ gainers: PriceMover[]; losers: PriceMover[] }> {
  const rows = await prisma.skin.findMany({
    where: { listingCount: { gt: 0 }, lowestPrice: { gt: 0 } },
    orderBy: [{ listingCount: "desc" }],
    take: limit * 6,
    select: {
      id: true,
      externalId: true,
      name: true,
      weapon: true,
      rarityColor: true,
      imageUrl: true,
      lowestPrice: true,
    },
  });

  const movers: PriceMover[] = rows.map((r) => {
    const price = Number(r.lowestPrice);
    const history = buildPriceHistory(r.externalId, price, MOVER_WINDOW_DAYS);
    const past = history[history.length - 1 - MOVER_LOOKBACK_DAYS] ?? history[0];
    return {
      skinId: r.id,
      name: r.name,
      weapon: r.weapon,
      rarityColor: r.rarityColor,
      imageUrl: r.imageUrl,
      price,
      changePct: past.price > 0 ? ((price - past.price) / past.price) * 100 : 0,
      spark: history.slice(-MOVER_LOOKBACK_DAYS - 1).map((p) => p.price),
    };
  });

  const sorted = [...movers].sort((a, b) => b.changePct - a.changePct);
  return {
    gainers: sorted.slice(0, limit),
    losers: sorted.slice(-limit).reverse(),
  };
}

const BUDGET_BANDS: [number, number][] = [
  [0, 5],
  [5, 25],
  [25, 100],
  [100, 500],
  [500, 1_000_000],
];

// A price-spread sample of listings so the budget slider always has something
// to show at every price point without re-querying on each drag.
export async function getBudgetSpread(perBand = 8): Promise<CatalogItem[]> {
  const bands = await Promise.all(
    BUDGET_BANDS.map(([priceMin, priceMax]) =>
      queryCatalog({ priceMin, priceMax, sort: "discount" }),
    ),
  );
  return bands.flatMap((b) => b.items.slice(0, perBand)).sort((a, b) => b.price - a.price);
}

export interface RarityBucket {
  rarity: string;
  count: number;
  fromPrice: number | null;
}

// Real distribution of tradable skins across rarity tiers — powers the
// interactive rarity explorer. Grouped on Skin so counts reflect unique skins
// that currently have at least one listing.
export async function getRarityBreakdown(): Promise<RarityBucket[]> {
  const rows = await prisma.skin.groupBy({
    by: ["rarity"],
    where: { listingCount: { gt: 0 } },
    _count: { _all: true },
    _min: { lowestPrice: true },
  });
  return rows.map((r) => ({
    rarity: r.rarity,
    count: r._count._all,
    fromPrice: r._min.lowestPrice != null ? Number(r._min.lowestPrice) : null,
  }));
}
