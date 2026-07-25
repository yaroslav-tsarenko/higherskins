"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, Search, Check } from "lucide-react";
import { EXTERIORS, RARITY_TIERS, type ExteriorCode } from "@/lib/skins/shared";
import type { CatalogItem, CatalogResult } from "@/lib/skins/queries";
import { SkinCard, SkinCardSkeleton } from "./SkinCard";

interface Facets {
  weapons: { weapon: string; category: string }[];
  categories: string[];
}

const SORTS = [
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
  { value: "float_asc", label: "Float ↑" },
  { value: "float_desc", label: "Float ↓" },
  { value: "discount", label: "Best discount" },
  { value: "newest", label: "Newest" },
];

const RARITIES = Object.entries(RARITY_TIERS)
  .sort((a, b) => a[1].order - b[1].order)
  .map(([name, meta]) => ({ name, color: meta.color }));

function useDebounced<T>(value: T, delay = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function CatalogClient({ facets, locale }: { facets: Facets; locale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Filter state derived from URL on first render.
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [categories, setCategories] = useState<string[]>(csv(params.get("category")));
  const [weapons, setWeapons] = useState<string[]>(csv(params.get("weapon")));
  const [rarities, setRarities] = useState<string[]>(csv(params.get("rarity")));
  const [exteriors, setExteriors] = useState<ExteriorCode[]>(
    csv(params.get("exterior")) as ExteriorCode[],
  );
  const [priceMin, setPriceMin] = useState(params.get("priceMin") ?? "");
  const [priceMax, setPriceMax] = useState(params.get("priceMax") ?? "");
  const [floatMax, setFloatMax] = useState(params.get("floatMax") ?? "");
  const [statTrak, setStatTrak] = useState(params.get("stattrak") === "1");
  const [souvenir, setSouvenir] = useState(params.get("souvenir") === "1");
  const [sort, setSort] = useState(params.get("sort") ?? "price_asc");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [data, setData] = useState<CatalogResult | null>(null);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const debouncedSearch = useDebounced(search);

  // Serialize filters into a query string.
  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (debouncedSearch) p.set("q", debouncedSearch);
    if (categories.length) p.set("category", categories.join(","));
    if (weapons.length) p.set("weapon", weapons.join(","));
    if (rarities.length) p.set("rarity", rarities.join(","));
    if (exteriors.length) p.set("exterior", exteriors.join(","));
    if (priceMin) p.set("priceMin", priceMin);
    if (priceMax) p.set("priceMax", priceMax);
    if (floatMax) p.set("floatMax", floatMax);
    if (statTrak) p.set("stattrak", "1");
    if (souvenir) p.set("souvenir", "1");
    if (sort) p.set("sort", sort);
    return p.toString();
  }, [debouncedSearch, categories, weapons, rarities, exteriors, priceMin, priceMax, floatMax, statTrak, souvenir, sort]);

  // Sync URL (shareable) whenever filters change.
  useEffect(() => {
    router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false });
    setPage(1);
  }, [queryString, pathname, router]);

  // Fetch catalog page.
  const abortRef = useRef<AbortController | null>(null);
  const fetchPage = useCallback(
    async (pageNum: number, append: boolean) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      try {
        const p = new URLSearchParams(queryString);
        p.set("page", String(pageNum));
        const res = await fetch(`/api/skins?${p.toString()}`, { signal: ac.signal });
        const json = (await res.json()) as CatalogResult;
        setData(json);
        setItems((prev) => (append ? [...prev, ...json.items] : json.items));
      } catch (err) {
        if ((err as Error).name !== "AbortError") console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [queryString],
  );

  useEffect(() => {
    fetchPage(1, false);
  }, [fetchPage]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPage(next, true);
  };

  const toggle = <T,>(list: T[], value: T, setter: (v: T[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const clearAll = () => {
    setSearch("");
    setCategories([]);
    setWeapons([]);
    setRarities([]);
    setExteriors([]);
    setPriceMin("");
    setPriceMax("");
    setFloatMax("");
    setStatTrak(false);
    setSouvenir(false);
    setSort("price_asc");
  };

  const activeCount =
    categories.length + weapons.length + rarities.length + exteriors.length +
    (priceMin ? 1 : 0) + (priceMax ? 1 : 0) + (floatMax ? 1 : 0) +
    (statTrak ? 1 : 0) + (souvenir ? 1 : 0) + (search ? 1 : 0);

  // Weapons grouped by category for the sidebar.
  const weaponsByCategory = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const { weapon, category } of facets.weapons) {
      if (!map.has(category)) map.set(category, []);
      map.get(category)!.push(weapon);
    }
    return [...map.entries()];
  }, [facets.weapons]);

  const sidebar = (
    <div className="flex flex-col gap-6">
      {/* search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-text-tertiary)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search skins…"
          className="w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] py-2 pl-9 pr-3 text-sm text-[color:var(--color-text)] outline-none focus:border-[color:var(--color-primary)]"
        />
      </div>

      {/* exterior */}
      <FilterGroup title="Exterior">
        <div className="flex flex-wrap gap-1.5">
          {EXTERIORS.map((e) => (
            <button
              key={e.code}
              onClick={() => toggle(exteriors, e.code, setExteriors)}
              className={`rounded-md border px-2 py-1 text-xs font-medium transition ${
                exteriors.includes(e.code)
                  ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary-tint)] text-[color:var(--color-text)]"
                  : "border-[color:var(--color-border)] text-[color:var(--color-text-secondary)] hover:border-[color:var(--color-border-hover)]"
              }`}
            >
              {e.short}
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* float max */}
      <FilterGroup title="Max float">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={floatMax || "1"}
          onChange={(e) => setFloatMax(e.target.value === "1" ? "" : e.target.value)}
          className="w-full accent-[color:var(--color-primary)]"
        />
        <div className="tnum flex justify-between text-[11px] text-[color:var(--color-text-tertiary)]">
          <span>0.00</span>
          <span>{floatMax || "1.00"}</span>
        </div>
      </FilterGroup>

      {/* price */}
      <FilterGroup title="Price (USD)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="tnum w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 text-sm outline-none focus:border-[color:var(--color-primary)]"
          />
          <span className="text-[color:var(--color-text-tertiary)]">–</span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="Max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="tnum w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 text-sm outline-none focus:border-[color:var(--color-primary)]"
          />
        </div>
      </FilterGroup>

      {/* rarity */}
      <FilterGroup title="Rarity">
        <div className="flex flex-col gap-1">
          {RARITIES.map((r) => (
            <label key={r.name} className="flex cursor-pointer items-center gap-2 text-sm text-[color:var(--color-text-secondary)]">
              <input
                type="checkbox"
                checked={rarities.includes(r.name)}
                onChange={() => toggle(rarities, r.name, setRarities)}
                className="sr-only"
              />
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border ${
                  rarities.includes(r.name) ? "border-transparent" : "border-[color:var(--color-border)]"
                }`}
                style={rarities.includes(r.name) ? { background: r.color } : undefined}
              >
                {rarities.includes(r.name) && <Check className="h-3 w-3 text-black" />}
              </span>
              <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
              {r.name}
            </label>
          ))}
        </div>
      </FilterGroup>

      {/* special */}
      <FilterGroup title="Special">
        <div className="flex flex-col gap-2">
          <Toggle label="StatTrak™" checked={statTrak} onChange={setStatTrak} />
          <Toggle label="Souvenir" checked={souvenir} onChange={setSouvenir} />
        </div>
      </FilterGroup>

      {/* category */}
      {facets.categories.length > 0 && (
        <FilterGroup title="Category">
          <div className="flex flex-wrap gap-1.5">
            {facets.categories.map((c) => (
              <button
                key={c}
                onClick={() => toggle(categories, c, setCategories)}
                className={`rounded-md border px-2 py-1 text-xs font-medium transition ${
                  categories.includes(c)
                    ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary-tint)] text-[color:var(--color-text)]"
                    : "border-[color:var(--color-border)] text-[color:var(--color-text-secondary)] hover:border-[color:var(--color-border-hover)]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </FilterGroup>
      )}

      {/* weapons */}
      <FilterGroup title="Weapon">
        <div className="flex flex-col gap-3">
          {weaponsByCategory.map(([category, ws]) => (
            <div key={category}>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-text-tertiary)]">
                {category}
              </div>
              <div className="flex flex-wrap gap-1">
                {ws.map((w) => (
                  <button
                    key={w}
                    onClick={() => toggle(weapons, w, setWeapons)}
                    className={`rounded border px-1.5 py-0.5 text-[11px] transition ${
                      weapons.includes(w)
                        ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary-tint)] text-[color:var(--color-text)]"
                        : "border-[color:var(--color-border)] text-[color:var(--color-text-secondary)] hover:border-[color:var(--color-border-hover)]"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </FilterGroup>
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-[var(--max-width)] gap-6 px-4 py-6">
      {/* desktop sidebar — sticky below the header, with its own scroll when
          filters exceed the viewport so the page keeps scrolling naturally. */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-[84px] flex max-h-[calc(100dvh-104px)] flex-col rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]">
          <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-4 py-3">
            <span className="font-display text-sm font-bold uppercase tracking-wide">Filters</span>
            {activeCount > 0 && (
              <button onClick={clearAll} className="text-xs text-[color:var(--color-accent)] hover:underline">
                Clear ({activeCount})
              </button>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
            {sidebar}
          </div>
        </div>
      </aside>

      {/* main */}
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
              {activeCount > 0 && (
                <span className="rounded-full bg-[color:var(--color-primary)] px-1.5 text-xs text-white tnum">{activeCount}</span>
              )}
            </button>
            <span className="tnum text-sm text-[color:var(--color-text-secondary)]">
              {data ? `${data.total.toLocaleString()} offers` : "…"}
            </span>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[color:var(--color-primary)]"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {items.map((it) => (
            <SkinCard key={it.listingId} item={it} locale={locale} />
          ))}
          {loading && items.length === 0 &&
            Array.from({ length: 12 }).map((_, i) => <SkinCardSkeleton key={i} />)}
        </div>

        {!loading && items.length === 0 && (
          <div className="py-24 text-center text-[color:var(--color-text-secondary)]">
            No skins match these filters.
            <button onClick={clearAll} className="ml-2 text-[color:var(--color-accent)] hover:underline">
              Reset
            </button>
          </div>
        )}

        {data && page < data.totalPages && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-6 py-2.5 text-sm font-medium hover:border-[color:var(--color-primary)] disabled:opacity-50"
            >
              {loading ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </div>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="glass absolute left-0 top-0 h-full w-[86%] max-w-sm overflow-y-auto p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-sm font-bold uppercase tracking-wide">Filters</span>
              <button onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebar}
            <button
              onClick={() => setMobileOpen(false)}
              className="mt-6 w-full rounded-lg bg-[color:var(--color-primary)] py-2.5 text-sm font-semibold text-white"
            >
              Show {data?.total.toLocaleString() ?? ""} offers
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
        {title}
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between text-sm text-[color:var(--color-text-secondary)]"
    >
      <span>{label}</span>
      <span
        className={`relative h-5 w-9 rounded-full transition ${
          checked ? "bg-[color:var(--color-primary)]" : "bg-[color:var(--color-bg-tertiary)]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

function csv(v: string | null): string[] {
  if (!v) return [];
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}
