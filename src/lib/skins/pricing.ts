import {
  EXTERIORS,
  type ExteriorCode,
  rarityMeta,
  round2,
  seededRng,
} from "./shared";

// ── Pluggable price provider ─────────────────────────────────────────────
// Real markets (Steam/Pricempire/Waxpeer) require paid API keys. We expose a
// deterministic provider so the catalog is fully populated and stable. Swap
// `activePriceProvider` for a real fetcher later without touching callers.

export interface PriceQuote {
  price: number; // our listing price (USD)
  steamPrice: number; // reference Steam price (USD)
  discountPct: number; // % cheaper than steam (positive = deal)
}

export interface PriceProvider {
  name: string;
  quote(input: {
    externalId: string;
    rarity: string;
    exterior: ExteriorCode;
    isStatTrak: boolean;
    isSouvenir: boolean;
    float: number;
  }): PriceQuote;
}

// Exterior price coefficient — FN commands a premium, BS is cheapest.
const EXTERIOR_COEF: Record<ExteriorCode, number> = {
  FN: 1.9,
  MW: 1.35,
  FT: 1.0,
  WW: 0.78,
  BS: 0.6,
  NA: 1.0,
};

export const deterministicProvider: PriceProvider = {
  name: "higherskins-synthetic",
  quote({ externalId, rarity, exterior, isStatTrak, isSouvenir, float }) {
    const tier = rarityMeta(rarity);
    const rng = seededRng(`${externalId}:base`);

    // Base price: rarity tier base + skewed random within tier span.
    const skew = Math.pow(rng(), 2.2); // most skins cheap, few expensive
    let steam = tier.base + skew * tier.span;

    steam *= EXTERIOR_COEF[exterior];

    // Lower float within an exterior = slightly higher price.
    const band = EXTERIORS.find((e) => e.code === exterior);
    if (band) {
      const pos = (float - band.floatMin) / (band.floatMax - band.floatMin || 1);
      steam *= 1.12 - 0.24 * Math.max(0, Math.min(1, pos));
    }

    if (isStatTrak) steam *= 1.45;
    if (isSouvenir) steam *= 1.7;

    steam = Math.max(0.03, steam);

    // Our price undercuts Steam by 4–22% (typical marketplace behavior).
    const discountRng = seededRng(`${externalId}:${exterior}:disc`);
    const discountPct = round2(4 + discountRng() * 18);
    const price = round2(steam * (1 - discountPct / 100));

    return { price, steamPrice: round2(steam), discountPct };
  },
};

export const activePriceProvider: PriceProvider = deterministicProvider;

// Deterministic float for a given listing slot within an exterior band.
export function floatForSlot(
  externalId: string,
  exterior: ExteriorCode,
  slot: number,
): number {
  const band = EXTERIORS.find((e) => e.code === exterior);
  if (!band) return 0;
  const rng = seededRng(`${externalId}:${exterior}:float:${slot}`);
  return round2(band.floatMin + rng() * (band.floatMax - band.floatMin)) ;
}

export function paintSeedForSlot(externalId: string, slot: number): number {
  const rng = seededRng(`${externalId}:seed:${slot}`);
  return Math.floor(rng() * 1000);
}

// ── Cross-market comparison (deterministic) ──────────────────────────────
export interface MarketQuote {
  market: string;
  price: number;
  url: string | null;
}

// Reference markets with a typical price multiplier vs our listing price.
const MARKETS: { name: string; coef: number }[] = [
  { name: "HigherSkins", coef: 1.0 },
  { name: "Steam", coef: 1.16 },
  { name: "Buff163", coef: 0.94 },
  { name: "Waxpeer", coef: 1.05 },
  { name: "CSFloat", coef: 1.09 },
  { name: "Skinport", coef: 1.12 },
];

export function crossMarketQuotes(externalId: string, ourPrice: number): MarketQuote[] {
  return MARKETS.map((m) => {
    const rng = seededRng(`${externalId}:${m.name}:mkt`);
    const jitter = 0.94 + rng() * 0.12; // ±6% noise
    return {
      market: m.name,
      price: round2(Math.max(0.03, ourPrice * m.coef * jitter)),
      url: m.name === "HigherSkins" ? null : null,
    };
  }).sort((a, b) => a.price - b.price);
}

// ── Price history (deterministic random walk) ────────────────────────────
export interface PricePoint {
  date: string; // ISO date
  price: number;
  volume: number;
}

export function buildPriceHistory(
  externalId: string,
  currentPrice: number,
  days = 365,
): PricePoint[] {
  const rng = seededRng(`${externalId}:history`);
  const points: PricePoint[] = [];
  // Walk backwards from current price, then reverse to chronological order.
  let price = currentPrice;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - i);
    const volume = Math.floor(rng() * 40) + (currentPrice > 100 ? 1 : 5);
    points.push({ date: date.toISOString().slice(0, 10), price: round2(price), volume });
    // Mean-reverting drift + noise as we step into the past.
    const drift = (rng() - 0.48) * 0.05;
    price = Math.max(0.03, price * (1 + drift));
  }
  return points.reverse();
}
