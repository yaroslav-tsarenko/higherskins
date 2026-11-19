"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";

export interface PayntWidgetProps {
  checkoutId: string;
  scriptUrl: string;
  integrity?: string;
  shopperResultUrl: string;
  brands?: string;
  /** Shown on the pay button, e.g. "Pay €3.00". */
  amount?: number;
  currency?: string;
  onReady?: () => void;
  className?: string;
}

// Card marks rendered inside the card number field. The widget's own brand
// dropdown is hidden (see globals.css); detection highlights the match.
const VISA_SVG = `<svg class="hs-card-brand" data-brand="VISA" viewBox="0 0 34 22" aria-hidden="true"><rect width="34" height="22" rx="4" fill="#fff"/><text x="17" y="15.2" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="10.5" font-weight="900" font-style="italic" letter-spacing="-0.3" fill="#1A1F71">VISA</text></svg>`;
const MASTER_SVG = `<svg class="hs-card-brand" data-brand="MASTER" viewBox="0 0 34 22" aria-hidden="true"><rect width="34" height="22" rx="4" fill="#252525"/><circle cx="13.5" cy="11" r="6" fill="#EB001B"/><circle cx="20.5" cy="11" r="6" fill="#F79E1B"/><path d="M17 6.12a6 6 0 0 1 0 9.76 6 6 0 0 1 0-9.76z" fill="#FF5F00"/></svg>`;

// Minimal shape of the globals OPPWA reads and writes.
type WpwlWindow = Window & { wpwlOptions?: Record<string, unknown>; wpwl?: unknown };
type IframeCommunication = { $iframe?: { addClass?: (c: string) => void; removeClass?: (c: string) => void } };

function formatAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function PayntWidget({
  checkoutId,
  scriptUrl,
  integrity,
  shopperResultUrl,
  brands = "VISA MASTER",
  amount,
  currency = "EUR",
  onReady,
  className = "",
}: PayntWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [threeDS, setThreeDS] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const payLabel = amount != null ? `Pay ${formatAmount(amount, currency)}` : "Pay now";

  useEffect(() => {
    if (!scriptUrl) return;

    setLoading(true);
    setLoadError(null);
    setThreeDS(false);

    let isCancelled = false;
    const root = containerRef.current;

    const decorate = () => {
      if (!root) return;
      const wrapper = root.querySelector(".wpwl-wrapper-cardNumber");
      if (wrapper && !wrapper.querySelector(".hs-card-brands")) {
        const marks = document.createElement("div");
        marks.className = "hs-card-brands";
        marks.innerHTML = VISA_SVG + MASTER_SVG;
        wrapper.appendChild(marks);
      }
      root
        .querySelector<HTMLInputElement>(".wpwl-control-expiry")
        ?.setAttribute("placeholder", "MM / YY");
      root
        .querySelector<HTMLInputElement>(".wpwl-control-cardHolder")
        ?.setAttribute("placeholder", "Name as shown on card");
    };

    const markReady = () => {
      if (isCancelled) return;
      decorate();
      setLoading(false);
      onReady?.();
    };

    const highlightBrand = (detected: string[] | undefined) => {
      const marks = root?.querySelector<HTMLElement>(".hs-card-brands");
      if (!marks) return;
      const list = (detected || []).map((b) => String(b).toUpperCase());
      if (list.length === 1) marks.setAttribute("data-detected", list[0]);
      else marks.removeAttribute("data-detected");
      marks.querySelectorAll<SVGElement>(".hs-card-brand").forEach((el) => {
        if (list.length === 1 && el.dataset.brand === list[0]) el.setAttribute("data-active", "");
        else el.removeAttribute("data-active");
      });
    };

    // 1. Configure OPPWA global options BEFORE the script executes.
    const w = window as WpwlWindow;
    w.wpwlOptions = {
      locale: "en",
      style: "plain", // bare markup, styled in globals.css
      brandDetection: true,
      brandDetectionType: "regex",
      showCVVHint: false,
      labels: {
        cardNumber: "Card number",
        expiryDate: "Expiry date",
        cardHolder: "Cardholder name",
        cvv: "CVC",
        submit: payLabel,
      },
      iframeStyles: {
        "card-number-placeholder": { color: "#6B7280" },
        "cvv-placeholder": { color: "#6B7280" },
      },
      spinner: { color: "#8B5CF6", lines: 10, length: 6, width: 3, radius: 10 },
      threeDIframeSize: { width: "100%", height: "600px" },
      onReady: function () {
        markReady();
      },
      onDetectBrand: function (detected: string[]) {
        highlightBrand(detected);
      },
      onChangeBrand: function (brand: string) {
        highlightBrand(brand ? [brand] : []);
      },
      // The default handlers paint the hosted iframes blue inline; use the
      // site's focus ring instead.
      onFocusIframeCommunication: function (this: IframeCommunication) {
        this.$iframe?.addClass?.("hs-focus");
      },
      onBlurIframeCommunication: function (this: IframeCommunication) {
        this.$iframe?.removeClass?.("hs-focus");
      },
      onLoadThreeDIframe: function () {
        if (isCancelled) return;
        setThreeDS(true);
        root?.scrollIntoView({ behavior: "smooth", block: "start" });
      },
      onError: function (error: unknown) {
        console.error("[PayNT OPPWA Error]:", error);
      },
    };

    // 2. As soon as OPPWA injects its markup, mark ready.
    let observer: MutationObserver | null = null;
    if (root) {
      observer = new MutationObserver(() => {
        if (root.querySelector(".wpwl-form .wpwl-group-cardNumber")) markReady();
      });
      observer.observe(root, { childList: true, subtree: true });
    }

    // 3. Fallback so the skeleton never sticks.
    const fallbackTimer = setTimeout(markReady, 4000);

    // 4. Inject the script.
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.crossOrigin = "anonymous";
    if (integrity) script.integrity = integrity;
    script.onload = () => setTimeout(markReady, 600);
    script.onerror = () => {
      if (isCancelled) return;
      console.error("[PayNT Widget] Failed to load paymentWidgets.js from", scriptUrl);
      setLoadError("We couldn't load the secure card form. Check your connection and reload.");
      setLoading(false);
    };
    document.body.appendChild(script);

    // 5. Cleanup on unmount or checkout change.
    return () => {
      isCancelled = true;
      clearTimeout(fallbackTimer);
      observer?.disconnect();
      script.parentNode?.removeChild(script);
      document.querySelectorAll(".wpwl-container").forEach((el) => el.remove());
      try {
        delete w.wpwl;
        delete w.wpwlOptions;
      } catch {
        w.wpwlOptions = undefined;
      }
    };
  }, [scriptUrl, integrity, checkoutId, onReady, payLabel]);

  return (
    <div className={`w-full ${className}`}>
      {threeDS && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[color:var(--color-primary)]/30 bg-[color:var(--color-primary-tint)] px-4 py-3">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[color:var(--color-primary)]" />
          <div>
            <p className="text-sm font-semibold text-[color:var(--color-text)]">
              Confirm the payment with your bank
            </p>
            <p className="mt-0.5 text-xs text-[color:var(--color-text-secondary)]">
              Complete the 3-D Secure check below. Don&apos;t close or refresh this page.
            </p>
          </div>
        </div>
      )}

      {loading && !loadError && (
        <div className="grid grid-cols-2 gap-x-3.5 gap-y-4" aria-busy="true" aria-label="Loading card form">
          {[
            "col-span-2",
            "col-span-2",
            "col-span-1",
            "col-span-1",
          ].map((span, i) => (
            <div key={i} className={span}>
              <div className="mb-2 h-3 w-24 animate-pulse rounded bg-[color:var(--color-line)]" />
              <div className="h-12 animate-pulse rounded-[var(--radius-md)] border border-[color:var(--color-line)] bg-[color:var(--color-bg)]" />
            </div>
          ))}
          <div className="col-span-2 mt-1 h-[3.25rem] animate-pulse rounded-[var(--radius-md)] bg-[color:var(--color-primary)]/30" />
        </div>
      )}

      {loadError && (
        <div className="rounded-xl border border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger-tint)] p-5 text-sm text-[color:var(--color-danger)]">
          <p className="font-semibold">{loadError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 rounded-lg bg-[color:var(--color-danger)] px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
          >
            Reload page
          </button>
        </div>
      )}

      {/* OPPWA mounts here. Kept in the DOM (no display:none) so it can measure. */}
      <div ref={containerRef} className="w-full scroll-mt-28">
        <form action={shopperResultUrl} className="paymentWidgets" data-brands={brands} />
      </div>

      {!threeDS && !loadError && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--color-line)] pt-4">
          <p className="flex items-center gap-2 text-xs text-[color:var(--color-text-tertiary)]">
            <Lock size={13} className="text-[color:var(--color-success)]" />
            Encrypted payment · 3-D Secure verified
          </p>
          <div
            className="flex items-center gap-1.5 [&_svg]:h-[1.35rem] [&_svg]:w-[2.1rem]"
            aria-label="Visa and Mastercard accepted"
            dangerouslySetInnerHTML={{ __html: VISA_SVG + MASTER_SVG }}
          />
        </div>
      )}
    </div>
  );
}
