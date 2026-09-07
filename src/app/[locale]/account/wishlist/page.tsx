import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { Heart, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Watchlist",
  description: "Save skins to watch — coming soon.",
};

export default function WishlistPage() {
  return (
    <div>
      <h1 className="mb-5 font-serif text-2xl font-medium tracking-tight text-[color:var(--color-text)] sm:text-3xl">
        Watchlist
      </h1>

      <div className="flex flex-col items-center gap-5 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-6 py-16 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]">
          <Heart size={26} strokeWidth={1.5} />
        </span>
        <h2 className="font-serif text-xl font-medium text-[color:var(--color-text)]">
          Coming soon — we&apos;re building this
        </h2>
        <p className="max-w-sm text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
          Saving skins to a watchlist and tracking their prices isn&apos;t live
          yet. In the meantime, browse the market and grab what you like.
        </p>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-primary)] px-5 py-3 text-sm font-bold text-white transition-all hover:brightness-110"
        >
          Browse the market <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
