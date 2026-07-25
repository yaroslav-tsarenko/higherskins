import { Link } from "@/i18n/routing";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Repeat, ArrowRight } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]",
  trade_sent: "bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]",
  completed: "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]",
  failed: "bg-[color:var(--color-danger)]/15 text-[color:var(--color-danger)]",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Processing",
  trade_sent: "Trade offer sent",
  completed: "Delivered",
  failed: "Failed",
};

export default async function TradesPage() {
  const user = await getSessionUser();

  const purchases = user
    ? await prisma.skinPurchase.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          listing: {
            select: {
              imageUrl: true,
              marketHashName: true,
              skin: { select: { id: true, name: true, imageUrl: true, rarityColor: true } },
            },
          },
        },
      }).catch(() => [])
    : [];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]">
          <Repeat size={20} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-[color:var(--color-text)]">
            My Trades
          </h1>
          <p className="text-sm text-[color:var(--color-text-secondary)]">
            Every purchase and its Steam delivery status.
          </p>
        </div>
      </div>

      {purchases.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-10 text-center">
          <p className="text-[15px] font-semibold text-[color:var(--color-text)]">
            No trades yet
          </p>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            Buy your first skin and it will appear here with live delivery status.
          </p>
          <Link
            href="/catalog"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[color:var(--color-primary)] px-6 text-sm font-bold text-white transition hover:brightness-110"
          >
            Browse the market <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {purchases.map((p) => {
            const skin = p.listing?.skin;
            const image = p.listing?.imageUrl ?? skin?.imageUrl ?? null;
            const name = skin?.name ?? p.listing?.marketHashName ?? `Order #${p.id.slice(0, 8)}`;
            const row = (
              <>
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)]"
                    style={skin ? { boxShadow: `inset 0 -2px 0 0 ${skin.rarityColor}` } : undefined}
                  >
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt={name} className="h-full w-full object-contain p-1" />
                    ) : (
                      <Repeat size={16} className="text-[color:var(--color-text-tertiary)]" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[color:var(--color-text)]">
                      {name}
                    </div>
                    <div className="font-mono text-[11px] text-[color:var(--color-text-tertiary)]">
                      {new Date(p.createdAt).toLocaleDateString()} · #{p.id.slice(0, 8)}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-sm font-bold tabular-nums text-[color:var(--color-text)]">
                    ${Number(p.price).toFixed(2)}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] ${
                      STATUS_STYLES[p.status] ?? STATUS_STYLES.pending
                    }`}
                  >
                    {STATUS_LABELS[p.status] ?? p.status.replace("_", " ")}
                  </span>
                </div>
              </>
            );
            const className =
              "flex items-center justify-between gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-4 py-3";
            return (
              <li key={p.id}>
                {skin ? (
                  <Link href={`/skin/${skin.id}`} className={`${className} transition-colors hover:border-[color:var(--color-primary)]`}>
                    {row}
                  </Link>
                ) : (
                  <div className={className}>{row}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
