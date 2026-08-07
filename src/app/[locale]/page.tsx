import type { Metadata } from "next";
import { JsonLd } from "@/components/shared/SEO/JsonLd";
import {
  getMarketStats,
  queryCatalog,
  getRecentListings,
  getRarityBreakdown,
  getCategoryShowcase,
  getTopMovers,
  getBudgetSpread,
  getMarketPulse,
  getMarketActivity,
  getTrendingSets,
  getCollections,
  getLoadoutPools,
  getExplorerPool,
  getDailyHighlights,
} from "@/lib/skins/queries";
import { SkinCard } from "@/components/skins/SkinCard";
import { Section, SectionHead } from "@/components/home/Section";
import { HeroMarketplace } from "@/components/home/HeroMarketplace";
import { MarketTicker } from "@/components/home/MarketTicker";
import { LiveActivityFeed } from "@/components/home/LiveActivityFeed";
import { MarketDashboard } from "@/components/home/MarketDashboard";
import { TrendingCarousel } from "@/components/home/TrendingCarousel";
import { SkinExplorer } from "@/components/home/SkinExplorer";
import { FeaturedCollections } from "@/components/home/FeaturedCollections";
import { LoadoutBuilder } from "@/components/home/LoadoutBuilder";
import { SkinCompare } from "@/components/home/SkinCompare";
import { DailyHighlights } from "@/components/home/DailyHighlights";
import { RarityExplorer } from "@/components/home/RarityExplorer";
import { WearSlider } from "@/components/home/WearSlider";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { TopMovers } from "@/components/home/TopMovers";
import { BudgetFinder } from "@/components/home/BudgetFinder";
import { HowItWorksSteps } from "@/components/home/HowItWorksSteps";
import { FaqAccordion } from "@/components/home/FaqAccordion";
import { brand } from "@/lib/brand";
import {
  Activity,
  BarChart3,
  Crosshair,
  Diamond,
  Flame,
  HelpCircle,
  Layers,
  Radio,
  Route,
  Sparkles,
  SlidersHorizontal,
  Swords,
  Trophy,
  Wallet,
} from "lucide-react";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: `${brand.displayName} — ${brand.tagline}` },
    description: brand.description,
    alternates: { canonical: "/" },
  };
}

export default async function HomePage() {
  const [
    stats,
    pulse,
    activity,
    trending,
    collections,
    loadout,
    explorerPool,
    highlights,
    deals,
    fresh,
    recent,
    rarities,
    categories,
    movers,
    budgetPool,
  ] = await Promise.all([
    getMarketStats(),
    getMarketPulse(),
    getMarketActivity(),
    getTrendingSets(),
    getCollections(),
    getLoadoutPools(),
    getExplorerPool(),
    getDailyHighlights(),
    queryCatalog({ sort: "discount", perPage: 12 }),
    queryCatalog({ sort: "newest", perPage: 12 }),
    getRecentListings(18),
    getRarityBreakdown(),
    getCategoryShowcase(),
    getTopMovers(),
    getBudgetSpread(),
  ]);

  const floaters = deals.items.slice(0, 3);

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

      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-12 px-4 py-8 sm:px-6 lg:px-8">
        <HeroMarketplace stats={stats} listedToday={pulse.listedToday} floaters={floaters} />

        <Section>
          <div className="mb-3 flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-accent)]">
            <Radio size={13} /> Live market · newest listings
          </div>
          <MarketTicker items={recent} />
        </Section>

        <Section id="market-pulse">
          <SectionHead
            icon={BarChart3}
            eyebrow="Market pulse"
            title="The market at a glance"
            description="Live numbers pulled straight from the listing book — supply, pricing and settled trades update as the market moves."
            href="/analytics"
            cta="Full analytics"
          />
          <MarketDashboard pulse={pulse} />
        </Section>

        <Section id="trending">
          <SectionHead
            icon={Flame}
            eyebrow="What's moving"
            title="Trending right now"
            description="Curated shelves rebuilt every minute from live listings — discounts, grails, fresh drops and knives."
            href="/catalog?sort=discount"
            cta="Open catalog"
          />
          <TrendingCarousel sets={trending} />
        </Section>

        <Section id="explorer">
          <SectionHead
            icon={SlidersHorizontal}
            eyebrow="Find your skin"
            title="Interactive skin explorer"
            description="Stack filters across category, rarity, wear and price, then carry the exact same query into the full catalog."
          />
          <SkinExplorer pool={explorerPool} />
        </Section>

        <Section id="activity">
          <SectionHead
            icon={Activity}
            eyebrow="Market insights"
            title="Live activity & 7-day movers"
            description="Every event below is a real listing state change. Movers compare each skin against its own price a week ago."
            href="/analytics"
            cta="See analytics"
          />
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
            <LiveActivityFeed events={activity} />
            <TopMovers gainers={movers.gainers} losers={movers.losers} />
          </div>
        </Section>

        <Section id="highlights">
          <SectionHead
            icon={Trophy}
            eyebrow="Daily highlights"
            title="Standouts on the board today"
            description="Four listings picked by measurable properties: deepest discount, highest value, cheapest Factory New and the entry-level knife."
          />
          <DailyHighlights highlights={highlights} />
        </Section>

        <Section id="collections">
          <SectionHead
            icon={Layers}
            eyebrow="Curated shelves"
            title="Featured collections"
            description="Hand-built entry points into the catalog, each backed by a live listing count."
            href="/catalog"
            cta="Browse everything"
          />
          <FeaturedCollections collections={collections} />
        </Section>

        <Section id="deals">
          <SectionHead
            icon={Flame}
            eyebrow="Best value"
            title="Biggest discounts"
            description="Listings priced furthest below their Steam reference price."
            href="/catalog?sort=discount"
            cta="See all deals"
          />
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {deals.items.slice(0, 6).map((item) => (
              <SkinCard key={item.listingId} item={item} />
            ))}
          </div>
        </Section>

        <Section id="loadout">
          <SectionHead
            icon={Swords}
            eyebrow="Plan your kit"
            title="Loadout builder & comparison"
            description="Assemble a four-slot loadout from real listings, or put two of them side by side on price, rarity, float and discount."
          />
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
            <LoadoutBuilder pools={loadout} />
            <SkinCompare pool={explorerPool} />
          </div>
        </Section>

        <Section id="categories">
          <SectionHead
            icon={Crosshair}
            eyebrow="Browse by type"
            title="Weapon categories"
            description="Jump straight into rifles, pistols, SMGs, heavies, knives or gloves."
            href="/catalog"
            cta="Open catalog"
          />
          <CategoryShowcase groups={categories} />
        </Section>

        <Section id="rarity">
          <SectionHead
            icon={Diamond}
            eyebrow="Know the market"
            title="Rarity tiers & float bands"
            description="How supply spreads across CS2 rarity tiers, and how a float value maps to the wear band you see on every listing."
            href="/faq"
            cta="Read the guide"
          />
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
            <RarityExplorer buckets={rarities} />
            <WearSlider />
          </div>
        </Section>

        <Section id="budget">
          <SectionHead
            icon={Wallet}
            eyebrow="Shop by budget"
            title="Set your price"
            description="Drag a budget and see what the market actually offers in that range."
            href="/catalog?sort=price_asc"
            cta="Browse cheapest"
          />
          <BudgetFinder pool={budgetPool} />
        </Section>

        <Section id="fresh">
          <SectionHead
            icon={Sparkles}
            eyebrow="Fresh drops"
            title="New listings"
            description="The most recent items added to the store."
            href="/catalog?sort=newest"
            cta="See what's new"
          />
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {fresh.items.slice(0, 6).map((item) => (
              <SkinCard key={item.listingId} item={item} />
            ))}
          </div>
        </Section>

        <Section id="how-it-works">
          <SectionHead
            icon={Route}
            eyebrow="Getting started"
            title="How trading works"
            description="Three steps from browsing to the trade landing in your Steam inventory."
            href="/how-it-works"
            cta="Full walkthrough"
          />
          <HowItWorksSteps />
        </Section>

        <Section id="faq">
          <SectionHead
            icon={HelpCircle}
            eyebrow="Good to know"
            title="Common questions"
            description="Trade speed, buyer protection, payouts and float — answered."
            href="/faq"
            cta="All answers"
          />
          <FaqAccordion />
        </Section>
      </div>
    </>
  );
}
