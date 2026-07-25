import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { getMarketStats, queryCatalog } from "@/lib/skins/queries";
import { buildPriceHistory } from "@/lib/skins/pricing";
import { PriceChart } from "@/components/skins/PriceChart";
import { SkinCard } from "@/components/skins/SkinCard";
import { brand } from "@/lib/brand";
import { Activity, TrendingUp, Layers, Percent, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: `Price charts & analytics — ${brand.displayName}`,
  description: `Live CS2 market analytics on ${brand.displayName}: price history, trending skins and cross-market benchmarks.`,
};

async function getFeaturedSkin() {
  const dragon = await prisma.skin.findFirst({
    where: { name: { contains: "Dragon Lore", mode: "insensitive" }, listingCount: { gt: 0 } },
    orderBy: { lowestPrice: "desc" },
    select: { id: true, externalId: true, name: true, weapon: true, lowestPrice: true, imageUrl: true, rarityColor: true },
  });
  if (dragon) return dragon;
  return prisma.skin.findFirst({
    where: { listingCount: { gt: 0 } },
    orderBy: { lowestPrice: "desc" },
    select: { id: true, externalId: true, name: true, weapon: true, lowestPrice: true, imageUrl: true, rarityColor: true },
  });
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-5">
      <div className="flex items-center gap-2 text-[color:var(--color-accent)]">
        <Icon size={16} />
        <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-text-tertiary)]">
          {label}
        </span>
      </div>
      <div className="mt-2 font-display text-2xl font-extrabold tabular-nums text-[color:var(--color-text)]">
        {value}
      </div>
    </div>
  );
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [stats, featured, movers] = await Promise.all([
    getMarketStats(),
    getFeaturedSkin(),
    queryCatalog({ sort: "discount", perPage: 12 }),
  ]);

  const history = featured
    ? buildPriceHistory(featured.externalId, Number(featured.lowestPrice ?? 1), 365)
    : [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-accent-tint)] px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-accent)]">
          <Activity size={12} /> Market analytics
        </span>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-[color:var(--color-text)]">
          Price charts &amp; market pulse
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] text-[color:var(--color-text-secondary)]">
          Track price history, spot trends and benchmark every skin against Steam
          and third-party markets — updated live from our order book.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Layers} label="Items listed" value={stats.totalListings.toLocaleString()} />
        <StatCard icon={TrendingUp} label="Unique skins" value={stats.totalSkins.toLocaleString()} />
        <StatCard icon={Percent} label="Avg discount" value={`${stats.avgDiscountPct.toFixed(1)}%`} />
        <StatCard icon={Activity} label="Market value" value={`$${Math.round(stats.marketValue).toLocaleString()}`} />
      </div>

      {featured && (
        <section className="mt-8">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <div className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-text-tertiary)]">
                Featured chart
              </div>
              <h2 className="font-display text-xl font-bold text-[color:var(--color-text)]">
                {featured.name}
              </h2>
            </div>
            <Link
              href={`/skin/${featured.id}`}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[color:var(--color-primary)] hover:underline"
            >
              View skin <ArrowRight size={14} />
            </Link>
          </div>
          <PriceChart history={history} />
        </section>
      )}

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-[color:var(--color-text)]">
            Biggest discounts right now
          </h2>
          <Link
            href="/catalog?sort=discount"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[color:var(--color-primary)] hover:underline"
          >
            See all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {movers.items.map((item) => (
            <SkinCard key={item.listingId} item={item} locale={locale} />
          ))}
        </div>
      </section>
    </div>
  );
}
