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
  searchParams: Promise<{
    listing?: string;
    purchaseId?: string;
    resourcePath?: string;
    id?: string;
  }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const listing = sp.listing;

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

  let initialBuyOpen = false;
  let initialDone = false;
  let initialError: string | null = null;

  if (sp.resourcePath && sp.purchaseId && user) {
    initialBuyOpen = true;
    try {
      const { getPaymentStatus, isPaymentSuccessful } = await import("@/lib/paynt");
      const { activeDeliveryProvider, computeFees } = await import("@/lib/skins/delivery");

      const purchase = await prisma.skinPurchase.findUnique({
        where: { id: sp.purchaseId },
        include: {
          listing: { include: { skin: true } },
          user: { include: { steamAccount: true } },
        },
      });

      if (purchase && purchase.userId === user.id) {
        if (purchase.status === "completed" || purchase.status === "trade_sent") {
          initialDone = true;
        } else {
          const status = await getPaymentStatus(sp.resourcePath);
          if (isPaymentSuccessful(status.result?.code)) {
            const price = Number(purchase.listing.price);
            const fees = computeFees(price);

            await prisma.$transaction([
              prisma.skinPurchase.update({
                where: { id: purchase.id },
                data: { status: "completed" },
              }),
              prisma.skinListing.update({
                where: { id: purchase.listingId },
                data: { status: "sold" },
              }),
              prisma.walletTransaction.create({
                data: {
                  userId: user.id,
                  type: "purchase",
                  status: "completed",
                  amount: -fees.total,
                  currency: "EUR",
                  provider: "paynt",
                  paymentId: status.id,
                  description: `${purchase.listing.skin.name} (Card payment)`,
                },
              }),
            ]);

            if (purchase.user.steamAccount?.tradeUrl) {
              void activeDeliveryProvider.deliver({
                purchaseId: purchase.id,
                tradeUrl: purchase.user.steamAccount.tradeUrl,
                marketHashName: purchase.listing.marketHashName,
                steamId64: purchase.user.steamAccount.steamId64,
                tradeToken: purchase.user.steamAccount.tradeToken ?? undefined,
              });
            }

            initialDone = true;
          } else {
            await prisma.skinListing
              .update({
                where: { id: purchase.listingId },
                data: { status: "available" },
              })
              .catch(() => {});
            await prisma.skinPurchase
              .update({
                where: { id: purchase.id },
                data: { status: "failed" },
              })
              .catch(() => {});

            initialError =
              status.result?.description ||
              "Your payment could not be processed. Please check your card or try another payment method.";
          }
        }
      }
    } catch (err) {
      console.error("[PayNT Skin Verify Error]:", err);
      initialError = "Could not verify payment status. Please check My Trades.";
    }
  }

  return (
    <SkinDetailClient
      skin={skin}
      history={history}
      markets={markets}
      locked={locked}
      initialListingId={listing}
      purchaseState={purchaseState}
      initialBuyOpen={initialBuyOpen}
      initialDone={initialDone}
      initialError={initialError}
    />
  );
}
