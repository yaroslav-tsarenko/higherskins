// Shared, dependency-free helpers for CS2 skins. Safe to import on client & server.

export type ExteriorCode = "FN" | "MW" | "FT" | "WW" | "BS" | "NA";

export const EXTERIORS: {
  code: ExteriorCode;
  label: string;
  short: string;
  floatMin: number;
  floatMax: number;
}[] = [
  { code: "FN", label: "Factory New", short: "FN", floatMin: 0.0, floatMax: 0.07 },
  { code: "MW", label: "Minimal Wear", short: "MW", floatMin: 0.07, floatMax: 0.15 },
  { code: "FT", label: "Field-Tested", short: "FT", floatMin: 0.15, floatMax: 0.38 },
  { code: "WW", label: "Well-Worn", short: "WW", floatMin: 0.38, floatMax: 0.45 },
  { code: "BS", label: "Battle-Scarred", short: "BS", floatMin: 0.45, floatMax: 1.0 },
];

export function exteriorFromLabel(label: string): ExteriorCode {
  const found = EXTERIORS.find((e) => e.label === label);
  return found ? found.code : "NA";
}

export function exteriorMeta(code: ExteriorCode) {
  return EXTERIORS.find((e) => e.code === code) ?? null;
}

// CS2 rarity ordering + tier used for pricing/sorting. Colors match source palette.
export const RARITY_TIERS: Record<
  string,
  { order: number; color: string; base: number; span: number }
> = {
  "Consumer Grade": { order: 0, color: "#b0c3d9", base: 0.05, span: 0.6 },
  "Industrial Grade": { order: 1, color: "#5e98d9", base: 0.2, span: 2 },
  "Mil-Spec Grade": { order: 2, color: "#4b69ff", base: 0.6, span: 9 },
  Restricted: { order: 3, color: "#8847ff", base: 2.5, span: 45 },
  Classified: { order: 4, color: "#d32ce6", base: 9, span: 170 },
  Covert: { order: 5, color: "#eb4b4b", base: 32, span: 900 },
  Extraordinary: { order: 6, color: "#ffd700", base: 90, span: 3200 },
  Contraband: { order: 7, color: "#e4ae39", base: 1200, span: 5000 },
};

export function rarityMeta(name: string) {
  return (
    RARITY_TIERS[name] ?? { order: 0, color: "#b0c3d9", base: 0.1, span: 1 }
  );
}

export function rarityColor(name: string, fallback?: string) {
  return RARITY_TIERS[name]?.color ?? fallback ?? "#b0c3d9";
}

// Deterministic PRNG so imports & derived data are stable/idempotent across runs.
export function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededRng(seed: string) {
  return mulberry32(hashString(seed));
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const CATEGORY_LABELS: Record<string, string> = {
  Rifles: "Rifles",
  Pistols: "Pistols",
  SMGs: "SMGs",
  Heavy: "Heavy",
  Knives: "Knives",
  Gloves: "Gloves",
  Equipment: "Equipment",
};
