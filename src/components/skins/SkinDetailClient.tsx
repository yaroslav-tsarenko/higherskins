"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { EXTERIORS, exteriorMeta, type ExteriorCode } from "@/lib/skins/shared";
import type { SkinPageData, SkinListingView } from "@/lib/skins/queries";
import type { MarketQuote, PricePoint } from "@/lib/skins/pricing";
import { PriceChart } from "./PriceChart";
import { TradeSetupModal, type PurchaseState } from "./TradeSetupModal";
import { useCurrency } from "@/providers/CurrencyProvider";

const EXTERIOR_COLORS: Record<ExteriorCode, string> = {
  FN: "var(--wear-fn)",
  MW: "var(--wear-mw)",
  FT: "var(--wear-ft)",
  WW: "var(--wear-ww)",
  BS: "var(--wear-bs)",
  NA: "var(--color-text-tertiary)",
};

function FloatBar({ float, exterior }: { float: number | null; exterior: ExteriorCode }) {
  const marker = float == null ? null : Math.max(0, Math.min(1, float));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative h-3 w-full overflow-hidden rounded-full wear-bar">
        {EXTERIORS.map((e) => (
          <span
            key={e.code}
            className="absolute top-0 h-full border-r border-black/30 last:border-r-0"
            style={{ left: `${e.floatMin * 100}%`, width: `${(e.floatMax - e.floatMin) * 100}%` }}
          />
        ))}
        {marker != null && (
          <span
            className="absolute top-1/2 h-5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/50 bg-white shadow"
            style={{ left: `${marker * 100}%` }}
          />
        )}
      </div>
      <div className="tnum flex justify-between text-[10px] text-[color:var(--color-text-tertiary)]">
        {EXTERIORS.map((e) => (
          <span key={e.code} className={exterior === e.code ? "font-bold text-[color:var(--color-text)]" : ""}>
            {e.short}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SkinDetailClient({
  skin,
  history,
  markets,
  locked,
  initialListingId,
  purchaseState,
}: {
  skin: SkinPageData;
  history: PricePoint[];
  markets: MarketQuote[];
  locked: boolean;
  initialListingId?: string;
  purchaseState: PurchaseState;
}) {
  const { format } = useCurrency();
  const [selectedId, setSelectedId] = useState(
    (initialListingId && skin.listings.some((l) => l.id === initialListingId)
      ? initialListingId
      : skin.listings[0]?.id) ?? "",
  );
  const [buyOpen, setBuyOpen] = useState(false);
  const selected = useMemo(
    () => skin.listings.find((l) => l.id === selectedId) ?? skin.listings[0],
    [skin.listings, selectedId],
  );

  const ext = selected ? exteriorMeta(selected.exterior) : null;
  const bestMarketPrice = markets.length ? markets[0].price : null;

  const displayName = skin.name.replace(/^(StatTrak™ |Souvenir )/, "");
  const finish = displayName.split(" | ").slice(1).join(" | ") || displayName;

  return (
    <div className="mx-auto w-full max-w-[var(--max-width)] px-4 py-6">
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-[color:var(--color-text-tertiary)]">
        <Link href="/" className="hover:text-[color:var(--color-text)]">Home</Link>
        <span>/</span>
        <Link href="/catalog" className="hover:text-[color:var(--color-text)]">Catalog</Link>
        <span>/</span>
        <span className="text-[color:var(--color-text-secondary)]">{skin.weapon}</span>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* left: image + core */}
        <div className="flex flex-col gap-4">
          <div
            className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] tech-grid"
            style={{ ["--rarity" as string]: skin.rarityColor }}
          >
            <div className="rarity-strip absolute inset-x-0 top-0 h-[3px]" />
            <div
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{ background: `radial-gradient(120% 80% at 50% 120%, ${skin.rarityColor}22 0%, transparent 60%)` }}
            />
            {(selected?.imageUrl ?? skin.imageUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected?.imageUrl ?? skin.imageUrl ?? ""}
                alt={skin.name}
                className="absolute inset-0 h-full w-full object-contain p-8"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[color:var(--color-text-tertiary)]">
                no image
              </div>
            )}
            <div className="absolute left-3 top-3 flex flex-wrap gap-1">
              {selected?.isStatTrak && (
                <span className="rounded bg-[color:var(--color-warning)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-black">StatTrak™</span>
              )}
              {selected?.isSouvenir && (
                <span className="rounded bg-[color:var(--color-teal)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-black">Souvenir</span>
              )}
            </div>
          </div>

          {/* float / pattern */}
          <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text-tertiary)]">
                Wear · {ext?.label ?? "—"}
              </span>
              {selected?.float != null && (
                <span className="tnum text-sm font-bold text-[color:var(--color-text)]">
                  {selected.float.toFixed(6)}
                </span>
              )}
            </div>
            <FloatBar float={selected?.float ?? null} exterior={selected?.exterior ?? "NA"} />
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[color:var(--color-border)] pt-3">
              <Meta label="Paint seed" value={selected?.paintSeed != null ? String(selected.paintSeed) : "—"} />
              <Meta label="Phase" value={selected?.phase ?? "—"} />
              <Meta label="Rarity" value={skin.rarity} color={skin.rarityColor} />
            </div>
            {selected?.inspectLink && (
              <a
                href={selected.inspectLink}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[color:var(--color-accent)] hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Inspect in-game
              </a>
            )}
          </div>
        </div>

        {/* right: title, price, buy, cross-market */}
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text-tertiary)]">
              {skin.weapon}
            </span>
            <h1 className="mt-1 font-display text-2xl font-bold leading-tight text-[color:var(--color-text)] sm:text-3xl">
              {finish}
            </h1>
            {skin.collection && (
              <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">{skin.collection}</p>
            )}
          </div>

          <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="tnum font-display text-3xl font-bold text-[color:var(--color-text)]">
                  {selected ? format(selected.price) : "—"}
                </div>
                {selected?.steamPrice != null && selected.discountPct != null && selected.discountPct > 0 && (
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="tnum text-sm text-[color:var(--color-text-tertiary)] line-through">
                      {format(selected.steamPrice)}
                    </span>
                    <span className="rounded bg-[color:var(--color-success)] px-1.5 py-0.5 text-[11px] font-bold text-black tnum">
                      −{Math.round(selected.discountPct)}%
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setBuyOpen(true)}
                className="rounded-xl bg-[color:var(--color-primary)] px-6 py-3 text-sm font-bold text-white shadow-[var(--shadow-glow-violet)] transition hover:brightness-110"
              >
                Buy now
              </button>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-[color:var(--color-text-tertiary)]">
              <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--color-success)]" />
              Instant Steam trade · buyer protection
            </p>
          </div>

          {/* similar offers */}
          <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text-tertiary)]">
              Available offers ({skin.listings.length})
            </div>
            <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto pr-1">
              {skin.listings.map((l, i) => (
                <OfferRow
                  key={l.id}
                  listing={l}
                  best={i === 0}
                  active={l.id === selectedId}
                  onSelect={() => setSelectedId(l.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* analytics section (gated) */}
      <div className="relative mt-8">
        <div className={locked ? "pointer-events-none select-none blur-md" : ""}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
            <PriceChart history={history} />
            <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text-tertiary)]">
                Cross-market comparison
              </div>
              <div className="flex flex-col gap-1.5">
                {markets.map((m) => {
                  const isBest = m.price === bestMarketPrice;
                  const isUs = m.market === "HigherSkins";
                  return (
                    <div
                      key={m.market}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                        isUs
                          ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary-tint)]"
                          : "border-[color:var(--color-border)]"
                      }`}
                    >
                      <span className="flex items-center gap-2 font-medium text-[color:var(--color-text)]">
                        {m.market}
                        {isBest && (
                          <span className="rounded bg-[color:var(--color-success)] px-1.5 py-0.5 text-[10px] font-bold text-black">
                            BEST
                          </span>
                        )}
                      </span>
                      <span className="tnum font-semibold text-[color:var(--color-text)]">{format(m.price)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {locked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="glass max-w-sm rounded-2xl border border-[color:var(--color-border)] p-6 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--color-primary-tint)]">
                <Lock className="h-5 w-5 text-[color:var(--color-primary)]" />
              </div>
              <h3 className="font-display text-lg font-bold text-[color:var(--color-text)]">
                Unlock full analytics
              </h3>
              <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
                Sign in to view price history, float breakdown and cross-market prices.
              </p>
              <Link
                href="/auth"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white shadow-[var(--shadow-glow-violet)]"
              >
                <Sparkles className="h-4 w-4" /> Sign in free
              </Link>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <TradeSetupModal
          open={buyOpen}
          onClose={() => setBuyOpen(false)}
          initialState={purchaseState}
          skinName={displayName}
          price={format(selected.price)}
          priceValue={selected.price}
          listingId={selected.id}
          next={`/skin/${skin.id}?listing=${selected.id}`}
        />
      )}
    </div>
  );
}

function Meta({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-[color:var(--color-text-tertiary)]">{label}</div>
      <div className="truncate text-sm font-semibold" style={color ? { color } : { color: "var(--color-text)" }}>
        {value}
      </div>
    </div>
  );
}

function OfferRow({
  listing,
  best,
  active,
  onSelect,
}: {
  listing: SkinListingView;
  best: boolean;
  active: boolean;
  onSelect: () => void;
}) {
  const { format } = useCurrency();
  const ext = exteriorMeta(listing.exterior);
  return (
    <button
      onClick={onSelect}
      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition ${
        active
          ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary-tint)]"
          : "border-[color:var(--color-border)] hover:border-[color:var(--color-border-hover)]"
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ color: listing.market === "higherskins" ? "var(--color-accent)" : "var(--color-text-secondary)", background: "var(--color-bg)" }}>
          {ext?.short ?? "—"}
        </span>
        {listing.float != null && (
          <span className="tnum truncate text-xs text-[color:var(--color-text-secondary)]">
            {listing.float.toFixed(4)}
          </span>
        )}
        {listing.isStatTrak && <span className="text-[10px] font-bold text-[color:var(--color-warning)]">ST</span>}
      </div>
      <div className="flex items-center gap-2">
        {best && (
          <span className="rounded bg-[color:var(--color-success)] px-1.5 py-0.5 text-[10px] font-bold text-black">BEST</span>
        )}
        <span className="tnum text-sm font-bold text-[color:var(--color-text)]">{format(listing.price)}</span>
      </div>
    </button>
  );
}
