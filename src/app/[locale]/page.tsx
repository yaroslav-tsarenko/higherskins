import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { JsonLd } from "@/components/shared/SEO/JsonLd";
import {
  getMarketStats,
  queryCatalog,
  getRecentListings,
  getRarityBreakdown,
  getCategoryShowcase,
  getTopMovers,
  getBudgetSpread,
} from "@/lib/skins/queries";
import { buildPriceHistory } from "@/lib/skins/pricing";
import { SkinCard } from "@/components/skins/SkinCard";
import { PriceChart } from "@/components/skins/PriceChart";
import { CountUp } from "@/components/home/CountUp";
import { MarketTicker } from "@/components/home/MarketTicker";
import { RarityExplorer } from "@/components/home/RarityExplorer";
import { WearSlider } from "@/components/home/WearSlider";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { TopMovers } from "@/components/home/TopMovers";
import { BudgetFinder } from "@/components/home/BudgetFinder";
import { HowItWorksSteps } from "@/components/home/HowItWorksSteps";
import { FaqAccordion } from "@/components/home/FaqAccordion";
import { brand } from "@/lib/brand";
import {
  ArrowRight,
  Layers,
  Percent,
  TrendingUp,
  Wallet,
  Flame,
  Sparkles,
  Gem,
  Radio,
  Diamond,
  ShieldCheck,
  Zap,
  Crosshair,
  Activity,
  Route,
  HelpCircle,
} from "lucide-react";

export const revalidate = 60;

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: `${brand.displayName} — ${brand.tagline}`,
    description: brand.description,
    alternates: { canonical: `/${locale}` },
    openGraph: { url: `/${locale}` },
  };
}

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

function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
  href,
  cta,
}: {
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-accent)]">
          <Icon size={13} /> {eyebrow}
        </div>
        <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-[color:var(--color-text)]">
          {title}
        </h2>
      </div>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-[color:var(--color-primary)] hover:underline"
      >
        {cta} <ArrowRight size={14} />
      </Link>
    </div>
  );
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  const [stats, featured, deals, fresh, highTier, recent, rarities, categories, movers, budgetPool] =
    await Promise.all([
      getMarketStats(),
      getFeaturedSkin(),
      queryCatalog({ sort: "discount", perPage: 10 }),
      queryCatalog({ sort: "newest", perPage: 10 }),
      queryCatalog({ categories: ["Knives", "Gloves"], sort: "price_desc", perPage: 8 }),
      getRecentListings(18),
      getRarityBreakdown(),
      getCategoryShowcase(),
      getTopMovers(),
      getBudgetSpread(),
    ]);

  const history = featured
    ? buildPriceHistory(featured.externalId, Number(featured.lowestPrice ?? 1), 365)
    : [];

  const statItems = [
    { icon: Layers, label: "Items listed", value: stats.totalListings, decimals: 0, prefix: "", suffix: "" },
    { icon: Wallet, label: "Market value", value: Math.round(stats.marketValue), decimals: 0, prefix: "$", suffix: "" },
    { icon: Percent, label: "Avg discount", value: stats.avgDiscountPct, decimals: 1, prefix: "", suffix: "%" },
    { icon: TrendingUp, label: "Unique skins", value: stats.totalSkins, decimals: 0, prefix: "", suffix: "" },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: brand.displayName,
          legalName: brand.company.legalName,
          alternateName: [brand.domain],
          url: brand.url,
          sameAs: [brand.url],
          description: brand.description,
        }}
      />

      <div className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6 sm:p-10 lg:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(60% 80% at 85% 10%, rgba(124,58,237,0.22) 0%, transparent 60%), radial-gradient(50% 60% at 10% 100%, rgba(34,211,238,0.16) 0%, transparent 60%)",
            }}
          />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-primary-tint)] px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-primary)]">
                <Zap size={12} /> Instant Steam trades
              </span>
              <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-[color:var(--color-text)] sm:text-5xl">
                Buy &amp; sell CS2 skins.{" "}
                <span className="bg-gradient-to-r from-[color:var(--color-primary)] to-[color:var(--color-accent)] bg-clip-text text-transparent">
                  Instantly.
                </span>
              </h1>
              <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
                Thousands of skins with live float, pattern and cross-market price
                data. Trade straight from your Steam inventory — fast, fair, secure.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/catalog"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-[color:var(--color-primary)] px-6 text-sm font-bold text-white shadow-[var(--shadow-glow-violet)] transition hover:brightness-110"
                >
                  Browse the market <ArrowRight size={16} />
                </Link>
                <Link
                  href="/sell"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-[color:var(--color-border)] px-6 text-sm font-bold text-[color:var(--color-text)] transition hover:border-[color:var(--color-primary)]"
                >
                  <Wallet size={16} /> Sell your skins
                </Link>
              </div>
              <div className="mt-5 flex items-center gap-2 text-[13px] text-[color:var(--color-text-tertiary)]">
                <ShieldCheck size={15} className="text-[color:var(--color-accent)]" />
                Buyer protection on every trade · No password ever shared
              </div>
            </div>

            {/* Featured high-tier showcase */}
            {featured && (
              <Link
                href={`/skin/${featured.id}`}
                className="card-lift group relative flex flex-col overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)]"
                style={{ ["--rarity" as string]: featured.rarityColor }}
              >
                <div className="rarity-strip h-[3px] w-full" />
                <div className="relative aspect-[16/10] overflow-hidden tech-grid">
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: `radial-gradient(120% 90% at 50% 120%, ${featured.rarityColor}2e 0%, transparent 60%)`,
                    }}
                  />
                  {featured.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featured.imageUrl}
                      alt={featured.name}
                      className="absolute inset-0 h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur">
                    <Gem size={11} /> Featured
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="truncate font-display text-[15px] font-bold text-[color:var(--color-text)]">
                      {featured.name}
                    </div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-[color:var(--color-text-tertiary)]">
                      {featured.weapon}
                    </div>
                  </div>
                  {featured.lowestPrice != null && (
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--color-text-tertiary)]">
                        from
                      </div>
                      <div className="font-display text-lg font-extrabold tabular-nums text-[color:var(--color-accent)]">
                        ${Number(featured.lowestPrice).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            )}
          </div>

          {/* Stats strip */}
          <div className="relative mt-8 grid grid-cols-2 gap-3 border-t border-[color:var(--color-border)] pt-6 lg:grid-cols-4">
            {statItems.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]">
                  <s.icon size={18} />
                </span>
                <div>
                  <CountUp
                    value={s.value}
                    decimals={s.decimals}
                    prefix={s.prefix}
                    suffix={s.suffix}
                    className="font-display text-xl font-extrabold tabular-nums leading-none text-[color:var(--color-text)]"
                  />
                  <div className="mt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Live market ticker ───────────────────────────────── */}
        <section className="mt-8">
          <div className="mb-3 flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-accent)]">
            <Radio size={13} /> Live market · newest listings
          </div>
          <MarketTicker items={recent} />
        </section>

        {/* ── Browse by category ───────────────────────────────── */}
        <section className="mt-12">
          <SectionHeader
            icon={Crosshair}
            eyebrow="Browse by type"
            title="Weapon categories"
            href="/catalog"
            cta="Open catalog"
          />
          <CategoryShowcase groups={categories} locale={locale} />
        </section>

        {/* ── Best deals ───────────────────────────────────────── */}
        <section className="mt-12">
          <SectionHeader
            icon={Flame}
            eyebrow="Best value"
            title="Biggest discounts"
            href="/catalog?sort=discount"
            cta="See all deals"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {deals.items.map((item) => (
              <SkinCard key={item.listingId} item={item} locale={locale} />
            ))}
          </div>
        </section>

        {/* ── Price chart teaser + high tier ───────────────────── */}
        <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeader
              icon={TrendingUp}
              eyebrow="Market pulse"
              title={featured ? featured.name.split(" | ")[0] || "Price history" : "Price history"}
              href="/analytics"
              cta="Open analytics"
            />
            {history.length > 0 && <PriceChart history={history} />}
          </div>
          <div>
            <SectionHeader
              icon={Gem}
              eyebrow="High tier"
              title="Knives & gloves"
              href="/catalog?category=Knives,Gloves"
              cta="Browse rare"
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {highTier.items.slice(0, 4).map((item) => (
                <SkinCard key={item.listingId} item={item} locale={locale} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Rarity explorer + wear demo ──────────────────────── */}
        <section className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
          <div className="flex flex-col">
            <SectionHeader
              icon={Diamond}
              eyebrow="Explore by tier"
              title="Rarity breakdown"
              href="/catalog"
              cta="Open catalog"
            />
            <RarityExplorer buckets={rarities} />
          </div>
          <div className="flex flex-col">
            <SectionHeader
              icon={Radio}
              eyebrow="Know your float"
              title="Wear & float"
              href="/faq"
              cta="Learn more"
            />
            <WearSlider />
          </div>
        </section>

        {/* ── Market movers + budget finder ────────────────────── */}
        <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="flex flex-col">
            <SectionHeader
              icon={Activity}
              eyebrow="Market insights"
              title="Top movers"
              href="/analytics"
              cta="Full analytics"
            />
            <TopMovers gainers={movers.gainers} losers={movers.losers} />
          </div>
          <div className="flex flex-col">
            <SectionHeader
              icon={Wallet}
              eyebrow="Shop by budget"
              title="Set your price"
              href="/catalog?sort=price_asc"
              cta="Browse cheapest"
            />
            <BudgetFinder pool={budgetPool} />
          </div>
        </section>

        {/* ── New listings ─────────────────────────────────────── */}
        <section className="mt-12">
          <SectionHeader
            icon={Sparkles}
            eyebrow="Fresh drops"
            title="New listings"
            href="/catalog?sort=newest"
            cta="See what's new"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {fresh.items.map((item) => (
              <SkinCard key={item.listingId} item={item} locale={locale} />
            ))}
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────── */}
        <section className="mt-12">
          <SectionHeader
            icon={Route}
            eyebrow="Getting started"
            title="How trading works"
            href="/how-it-works"
            cta="Full walkthrough"
          />
          <HowItWorksSteps />
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section className="mt-12">
          <SectionHeader
            icon={HelpCircle}
            eyebrow="Good to know"
            title="Common questions"
            href="/faq"
            cta="All answers"
          />
          <FaqAccordion />
        </section>
      </div>
    </>
  );
}
