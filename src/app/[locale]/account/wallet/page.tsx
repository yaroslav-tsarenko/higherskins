import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWalletBalance } from "@/lib/skins/delivery";
import { settleTopup } from "@/lib/wallet";
import { WalletPanel, type WalletNotice, type WalletTx } from "@/components/account/WalletPanel";

export const dynamic = "force-dynamic";

export default async function WalletPage({
  searchParams,
}: {
  searchParams?: Promise<{ topup?: string; resourcePath?: string; id?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const sp = searchParams ? await searchParams : {};
  let notice: WalletNotice | null = null;

  // Shopper returning from the payment page. The webhook may already have
  // settled the top-up; if not, verify it with the provider ourselves.
  if (sp.topup) {
    let tx = await prisma.walletTransaction.findUnique({ where: { id: sp.topup } });

    if (tx && tx.userId === user.id) {
      if (tx.status !== "completed" && sp.resourcePath) {
        try {
          const { getPaymentStatus, isPaymentPending, isPaymentSuccessful } = await import(
            "@/lib/paynt"
          );
          const status = await getPaymentStatus(sp.resourcePath);
          const code = status.result?.code;
          if (isPaymentSuccessful(code)) {
            await settleTopup(tx.id, "completed", status.id);
          } else if (!isPaymentPending(code)) {
            await settleTopup(tx.id, "failed", status.id);
          }
          tx = await prisma.walletTransaction.findUnique({ where: { id: tx.id } });
        } catch (err) {
          console.error("[PayNT Wallet Verify Error]:", err);
        }
      }

      if (tx?.listingId) {
        if (tx.status === "completed") {
          const bought = await prisma.skinPurchase.findFirst({
            where: { listingId: tx.listingId, userId: user.id },
            select: { id: true },
          });
          if (bought) redirect("/account/trades");
          notice = {
            tone: "warning",
            text: "Your card payment went through, but this skin was sold before we could secure it. The funds are in your wallet — pick another offer and pay from your balance.",
          };
        } else if (tx.status === "failed") {
          notice = {
            tone: "danger",
            text: "Your card payment was declined, so nothing was charged. Try again or use another card.",
          };
        } else {
          notice = {
            tone: "info",
            text: "We're confirming your card payment. Your skin will be sent as soon as it clears — check My Trades in a minute.",
          };
        }
      }
    }
  }

  const rows = await prisma.walletTransaction
    .findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    .catch(() => []);

  const transactions: WalletTx[] = rows.map((r) => ({
    id: r.id,
    type: r.type,
    status: r.status,
    amount: Number(r.amount),
    description: r.description,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <WalletPanel
      balanceEur={await getWalletBalance(user.id)}
      transactions={transactions}
      hasAddress={user.addresses.length > 0}
      notice={notice}
    />
  );
}
