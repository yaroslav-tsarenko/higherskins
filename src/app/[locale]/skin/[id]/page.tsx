import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSkinPageData } from "@/lib/skins/queries";
import { buildPriceHistory, crossMarketQuotes } from "@/lib/skins/pricing";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SkinDetailClient } from "@/components/skins/SkinDetailClient";
import type { PurchaseState } from "@/components/skins/TradeSetupModal";
import { brand } from "@/lib/brand";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const skin = await getSkinPageData(id);
  if (!skin) return { title: `Skin — ${brand.displayName}` };
  return {
    title: `${skin.name} — ${brand.displayName}`,
    description: `Buy ${skin.name} on ${brand.displayName}. Live float, pattern and cross-market price data.`,
  };
}

export default async function SkinDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ listing?: string }>;
}) {
  const { locale, id } = await params;
  const { listing } = await searchParams;

  const skin = await getSkinPageData(id);
  if (!skin) notFound();

  const basePrice = skin.listings[0]?.price ?? skin.lowestPrice ?? 1;
  const history = buildPriceHistory(skin.externalId, basePrice, 365);
  const markets = crossMarketQuotes(skin.externalId, basePrice);

  const user = await getSessionUser();
  const locked = !user;

  let purchaseState: PurchaseState = "anon";
  if (user) {
    const steam = await prisma.steamAccount.findUnique({
      where: { userId: user.id },
      select: { tradeUrlVerified: true },
    });
    if (!steam) {
      purchaseState = "no-steam";
    } else {
      purchaseState = steam.tradeUrlVerified ? "ready" : "no-trade-url";
    }
  }

  return (
    <SkinDetailClient
      skin={skin}
      history={history}
      markets={markets}
      locale={locale}
      locked={locked}
      initialListingId={listing}
      purchaseState={purchaseState}
    />
  );
}
