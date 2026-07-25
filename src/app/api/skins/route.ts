import { NextResponse } from "next/server";
import { queryCatalog, type CatalogFilters } from "@/lib/skins/queries";
import type { ExteriorCode } from "@/lib/skins/shared";

export const runtime = "nodejs";

function csv(v: string | null): string[] | undefined {
  if (!v) return undefined;
  const parts = v.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : undefined;
}

function num(v: string | null): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams;

  const filters: CatalogFilters = {
    search: q.get("q") || undefined,
    weapons: csv(q.get("weapon")),
    categories: csv(q.get("category")),
    rarities: csv(q.get("rarity")),
    exteriors: csv(q.get("exterior")) as ExteriorCode[] | undefined,
    priceMin: num(q.get("priceMin")),
    priceMax: num(q.get("priceMax")),
    floatMin: num(q.get("floatMin")),
    floatMax: num(q.get("floatMax")),
    statTrak: q.get("stattrak") === "1",
    souvenir: q.get("souvenir") === "1",
    sort: q.get("sort") || "price_asc",
    page: num(q.get("page")) ?? 1,
    perPage: num(q.get("perPage")) ?? 48,
  };

  try {
    const result = await queryCatalog(filters);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load catalog" },
      { status: 500 },
    );
  }
}
