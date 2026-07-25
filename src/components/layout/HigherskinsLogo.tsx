/**
 * HigherSkins mark — a double ascending chevron ("higher"): the upper stroke
 * carries the violet→cyan brand rim, the lower one the CS2 wear gradient
 * (Factory New green → Battle-Scarred red) that every trader reads instantly.
 * Paired with a Space Grotesk wordmark. Original artwork — no game assets.
 */

export function HigherskinsMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="hs-rim" x1="4" y1="26" x2="28" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
        <linearGradient id="hs-wear" x1="5" y1="27" x2="27" y2="27" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4ade80" />
          <stop offset="0.35" stopColor="#a3e635" />
          <stop offset="0.62" stopColor="#facc15" />
          <stop offset="0.82" stopColor="#fb923c" />
          <stop offset="1" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      {/* Upper chevron — brand rim */}
      <path
        d="M5 17.5L16 5.5L27 17.5"
        stroke="url(#hs-rim)"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Lower chevron — wear gradient */}
      <path
        d="M7.5 26.5L16 17.2L24.5 26.5"
        stroke="url(#hs-wear)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Apex spark */}
      <circle cx="16" cy="5.5" r="1.9" fill="#22D3EE" />
    </svg>
  );
}

export function HigherskinsLogo({
  size = 22,
  tone = "dark",
  showWordmark = true,
}: {
  size?: number;
  tone?: "dark" | "light";
  showWordmark?: boolean;
}) {
  const textColor = tone === "light" ? "#F5F7FA" : "var(--color-text)";
  const markSize = Math.max(22, Math.round(size * 1.4));
  return (
    <span className="inline-flex items-center gap-2 leading-none">
      <HigherskinsMark size={markSize} />
      {showWordmark && (
        <span
          className="font-display font-bold tracking-tight"
          style={{ fontSize: size, letterSpacing: "-0.02em", color: textColor }}
        >
          Higher<span style={{ color: "var(--color-primary)" }}>Skins</span>
        </span>
      )}
    </span>
  );
}
