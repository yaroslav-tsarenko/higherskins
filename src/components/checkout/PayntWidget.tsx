"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, ShieldCheck, Lock } from "lucide-react";

export interface PayntWidgetProps {
  checkoutId: string;
  scriptUrl: string;
  integrity?: string;
  shopperResultUrl: string;
  brands?: string;
  onReady?: () => void;
  className?: string;
}

export function PayntWidget({
  checkoutId,
  scriptUrl,
  integrity,
  shopperResultUrl,
  brands = "VISA MASTER",
  onReady,
  className = "",
}: PayntWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scriptUrl) return;

    setLoading(true);
    setLoadError(null);

    let isCancelled = false;

    const markReady = () => {
      if (isCancelled) return;
      setLoading(false);
      onReady?.();
    };

    // 1. Configure OPPWA global options BEFORE script executes
    (window as any).wpwlOptions = {
      locale: "en",
      style: "plain", // Allows custom responsive styles from globals.css to apply
      brandDetection: true,
      showCVVHint: true,
      labels: {
        cvv: "CVC / CVV",
        cardHolder: "Cardholder Name",
      },
      onReady: function () {
        console.log("[PayNT Widget] wpwlOptions.onReady fired");
        markReady();
      },
      onError: function (error: any) {
        console.error("[PayNT OPPWA Error]:", error);
      },
    };

    // 2. Observe DOM: as soon as OPPWA injects .wpwl-container into the form, mark ready
    const formEl = containerRef.current?.querySelector("form.paymentWidgets");
    let observer: MutationObserver | null = null;
    if (formEl) {
      observer = new MutationObserver(() => {
        if (formEl.querySelector(".wpwl-container, .wpwl-form, .wpwl-group, iframe")) {
          markReady();
        }
      });
      observer.observe(formEl, { childList: true, subtree: true });
    }

    // 3. Fallback timer: ensure loading placeholder disappears after script mounts
    const fallbackTimer = setTimeout(() => {
      markReady();
    }, 2000);

    // 4. Inject script dynamically
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.crossOrigin = "anonymous";
    if (integrity) {
      script.integrity = integrity;
    }

    script.onload = () => {
      // Short grace period for iframes to mount
      setTimeout(markReady, 600);
    };

    script.onerror = () => {
      if (isCancelled) return;
      console.error("[PayNT Widget] Failed to load paymentWidgets.js from", scriptUrl);
      setLoadError("Failed to load secure card form. Please check your connection or reload.");
      setLoading(false);
    };

    document.body.appendChild(script);

    // 5. Cleanup on unmount or checkoutId change
    return () => {
      isCancelled = true;
      clearTimeout(fallbackTimer);
      if (observer) observer.disconnect();

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      // Remove any lingering OPPWA widget nodes to avoid duplicate forms
      const containers = document.querySelectorAll(".wpwl-container");
      containers.forEach((el) => el.remove());

      try {
        delete (window as any).wpwl;
        delete (window as any).wpwlOptions;
      } catch {
        (window as any).wpwlOptions = undefined;
      }
    };
  }, [scriptUrl, integrity, checkoutId, onReady]);

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      {/* Security badge header */}
      <div className="mb-4 flex items-center justify-between rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] px-4 py-2.5 text-xs text-[color:var(--color-text-secondary)]">
        <div className="flex items-center gap-2">
          <Lock size={14} className="text-[color:var(--color-primary)]" />
          <span className="font-medium text-[color:var(--color-text)]">
            PCI DSS SAQ-A 256-Bit SSL Encrypted
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[color:var(--color-text-tertiary)]">
          <ShieldCheck size={14} className="text-[color:var(--color-success)]" />
          <span>PayNT 3D Secure</span>
        </div>
      </div>

      {/* Loading Spinner overlay while iframes load */}
      {loading && !loadError && (
        <div className="mb-4 flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-6 text-center">
          <Loader2 size={30} className="animate-spin text-[color:var(--color-primary)]" />
          <p className="text-sm font-medium text-[color:var(--color-text)]">
            Loading secure payment form...
          </p>
          <p className="text-xs text-[color:var(--color-text-tertiary)]">
            Establishing encrypted channel with card network
          </p>
        </div>
      )}

      {/* Load error fallback */}
      {loadError && (
        <div className="mb-4 rounded-2xl border border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger)]/10 p-5 text-sm text-[color:var(--color-danger)]">
          <p className="font-semibold">{loadError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 rounded-lg bg-[color:var(--color-danger)] px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
          >
            Reload Page
          </button>
        </div>
      )}

      {/* OPPWA Payment Form Target — stays in the DOM without display:none so OPPWA can measure and mount */}
      <div className="w-full">
        <form
          action={shopperResultUrl}
          className="paymentWidgets"
          data-brands={brands}
        />
      </div>
    </div>
  );
}
