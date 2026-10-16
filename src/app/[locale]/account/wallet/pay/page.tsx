import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PayntWidget } from "@/components/checkout/PayntWidget";
import { Wallet, ShieldCheck, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function WalletPayPage({
  searchParams,
}: {
  searchParams: Promise<{
    topupId?: string;
    checkoutId?: string;
    scriptUrl?: string;
    shopperResultUrl?: string;
    integrity?: string;
  }>;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/login?next=/account/wallet");
  }

  const sp = await searchParams;
  if (!sp.topupId || !sp.checkoutId) {
    redirect("/account/wallet");
  }

  const tx = await prisma.walletTransaction.findUnique({
    where: { id: sp.topupId },
  });

  if (!tx || tx.userId !== user.id || tx.status !== "pending") {
    redirect("/account/wallet");
  }

  const baseUrl = process.env.PAYNT_BASE_URL || "https://eu-test.oppwa.com";
  const scriptUrl = sp.scriptUrl || `${baseUrl}/v1/paymentWidgets.js?checkoutId=${sp.checkoutId}`;
  const shopperResultUrl = sp.shopperResultUrl || `/account/wallet?topup=${tx.id}`;

  return (
    <div className="w-full max-w-3xl">
      <Link
        href="/account/wallet"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text-secondary)] transition-colors hover:text-[color:var(--color-text)]"
      >
        <ArrowLeft size={16} />
        Back to Wallet
      </Link>

      <div className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-[color:var(--color-line)] pb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]">
              <Wallet size={20} />
            </span>
            <div>
              <h1 className="font-serif text-xl font-medium tracking-tight text-[color:var(--color-text)]">
                Wallet Top-up
              </h1>
              <p className="text-xs text-[color:var(--color-text-secondary)]">
                Adding €{Number(tx.amount).toFixed(2)} to your balance
              </p>
            </div>
          </div>
          <span className="font-mono text-2xl font-bold text-[color:var(--color-text)]">
            €{Number(tx.amount).toFixed(2)}
          </span>
        </div>

        <PayntWidget
          checkoutId={sp.checkoutId}
          scriptUrl={scriptUrl}
          integrity={sp.integrity}
          shopperResultUrl={shopperResultUrl}
        />
      </div>
    </div>
  );
}
