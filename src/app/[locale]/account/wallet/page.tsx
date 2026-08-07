import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WalletPanel, type WalletTx } from "@/components/account/WalletPanel";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const user = await getSessionUser();
  if (!user) return null;

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
