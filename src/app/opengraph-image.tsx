import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";

export const alt = `${brand.displayName} — ${brand.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "radial-gradient(1200px 630px at 80% -10%, #2a1a12 0%, #0d0b0a 55%)",
          color: "#f5f1ea",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "#e8834a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0d0b0a",
              fontSize: "28px",
              fontWeight: 800,
            }}
          >
            H
          </div>
          <div
            style={{
              fontSize: "26px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            {brand.displayName}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              fontSize: "68px",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              maxWidth: "900px",
            }}
          >
            {brand.tagline}
          </div>
          <div
            style={{
              fontSize: "26px",
              color: "#b7ada0",
              maxWidth: "820px",
              lineHeight: 1.4,
            }}
          >
            Live float, pattern &amp; price data. Compare markets and trade
            instantly via Steam.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "22px",
            color: "#e8834a",
            fontWeight: 600,
          }}
        >
          {brand.domain}
        </div>
      </div>
    ),
    { ...size },
  );
}
