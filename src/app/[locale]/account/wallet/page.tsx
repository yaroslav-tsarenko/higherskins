import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WalletPanel, type WalletTx } from "@/components/account/WalletPanel";

export const dynamic = "force-dynamic";

export default async function WalletPage({
  searchParams,
}: {
  searchParams?: Promise<{ topup?: string; resourcePath?: string; id?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const sp = searchParams ? await searchParams : {};
  if (sp.resourcePath && sp.topup) {
    const tx = await prisma.walletTransaction.findUnique({
      where: { id: sp.topup },
    });

    if (tx && tx.status === "pending" && tx.userId === user.id) {
      try {
        const { getPaymentStatus, isPaymentSuccessful } = await import("@/lib/paynt");
        const status = await getPaymentStatus(sp.resourcePath);

        if (isPaymentSuccessful(status.result?.code)) {
          await prisma.$transaction([
            prisma.walletTransaction.update({
              where: { id: tx.id },
              data: { status: "completed", paymentId: status.id },
            }),
            prisma.user.update({
              where: { id: user.id },
              data: { balance: { increment: tx.amount } },
            }),
          ]);
          // Refresh user balance in current scope
          user.balance = (Number(user.balance) + Number(tx.amount)) as any;
        } else {
          await prisma.walletTransaction.update({
            where: { id: tx.id },
            data: { status: "failed", paymentId: status.id },
          });
        }
      } catch (err) {
        console.error("[PayNT Wallet Verify Error]:", err);
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
      balanceEur={Number(user.balance)}
      transactions={transactions}
      hasAddress={user.addresses.length > 0}
    />
  );
}
