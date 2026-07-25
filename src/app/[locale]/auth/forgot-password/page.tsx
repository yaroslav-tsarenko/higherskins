"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Mail, ShoppingBag, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }
      setSent(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.4 },
    }),
  } as const;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[color:var(--color-bg)] px-4 py-8">
      <motion.div
        className="relative w-full max-w-md rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-8 shadow-sm sm:p-10"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div className="mb-8 text-center" custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <div className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--color-primary)] text-white">
            <ShoppingBag size={24} strokeWidth={1.5} />
          </div>
          <h1 className="mb-2 font-serif text-3xl font-medium tracking-tight text-[color:var(--color-text)]">{t("forgotPasswordTitle")}</h1>
          <p className="text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">{t("forgotPasswordSubtitle")}</p>
        </motion.div>

        {sent ? (
          <motion.div
            className="rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-bg-secondary)] p-6 text-center"
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <CheckCircle size={32} className="mx-auto mb-3 text-[color:var(--color-success)]" strokeWidth={1.5} />
            <p className="text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">{t("resetEmailSent")}</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <motion.div className="flex flex-col gap-1.5" custom={1} variants={fadeUp} initial="hidden" animate="visible">
              <label className="text-[13px] font-medium text-[color:var(--color-text-secondary)]">{t("email")}</label>
              <div className="relative flex items-center">
                <Mail size={16} className="pointer-events-none absolute left-3 z-10 text-[color:var(--color-text-tertiary)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] py-2.5 pl-10 pr-3 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-tertiary)] focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
                />
              </div>
            </motion.div>

            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="mt-1">
              <Button type="submit" color="primary" fullWidth isLoading={loading}>
                {t("sendResetLink")}
              </Button>
            </motion.div>
          </form>
        )}

        <motion.p className="mt-7 text-center text-sm text-[color:var(--color-text-secondary)]" custom={3} variants={fadeUp} initial="hidden" animate="visible">
          <Link href="/auth/login" className="inline-flex items-center gap-1 font-semibold text-[color:var(--color-accent)] hover:opacity-80">
            <ArrowLeft size={14} />
            {t("backToLogin")}
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
