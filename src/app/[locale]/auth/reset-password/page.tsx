"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Lock, Eye, EyeOff, ShoppingBag, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(t("passwordsMismatch"));
      return;
    }
    if (password.length < 6) {
      toast.error(t("passwordTooShort"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSuccess(true);
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

  if (!token) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[color:var(--color-bg)] px-4 py-8">
        <motion.div
          className="relative w-full max-w-md rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-8 shadow-sm sm:p-10"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--color-primary)] text-white">
              <ShoppingBag size={24} strokeWidth={1.5} />
            </div>
            <h1 className="mb-2 font-serif text-3xl font-medium tracking-tight text-[color:var(--color-text)]">{t("invalidResetLink")}</h1>
            <p className="text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">{t("invalidResetLinkDesc")}</p>
          </div>
          <p className="mt-7 text-center text-sm text-[color:var(--color-text-secondary)]">
            <Link href="/auth/forgot-password" className="font-semibold text-[color:var(--color-accent)] hover:opacity-80">{t("requestNewLink")}</Link>
          </p>
        </motion.div>
      </div>
    );
  }

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
          <h1 className="mb-2 font-serif text-3xl font-medium tracking-tight text-[color:var(--color-text)]">{t("resetPasswordTitle")}</h1>
          <p className="text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">{t("resetPasswordSubtitle")}</p>
        </motion.div>

        {success ? (
          <motion.div
            className="rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-bg-secondary)] p-6 text-center"
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <CheckCircle size={32} className="mx-auto mb-3 text-[color:var(--color-success)]" strokeWidth={1.5} />
            <p className="text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">{t("passwordResetSuccess")}</p>
            <p className="mt-4">
              <Link href="/auth/login" className="font-semibold text-[color:var(--color-accent)] hover:opacity-80">{t("signIn")}</Link>
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <motion.div className="flex flex-col gap-1.5" custom={1} variants={fadeUp} initial="hidden" animate="visible">
              <label className="text-[13px] font-medium text-[color:var(--color-text-secondary)]">{t("newPassword")}</label>
              <div className="relative flex items-center">
                <Lock size={16} className="pointer-events-none absolute left-3 z-10 text-[color:var(--color-text-tertiary)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Min 6 characters"
                  className="w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] py-2.5 pl-10 pr-10 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-tertiary)] focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
                />
                <button
                  type="button"
                  className="absolute right-2 inline-flex items-center justify-center rounded p-1 text-[color:var(--color-text-tertiary)] hover:text-[color:var(--color-text-secondary)]"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>

            <motion.div className="flex flex-col gap-1.5" custom={2} variants={fadeUp} initial="hidden" animate="visible">
              <label className="text-[13px] font-medium text-[color:var(--color-text-secondary)]">{t("confirmPassword")}</label>
              <div className="relative flex items-center">
                <Lock size={16} className="pointer-events-none absolute left-3 z-10 text-[color:var(--color-text-tertiary)]" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your new password"
                  className="w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] py-2.5 pl-10 pr-10 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-tertiary)] focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
                />
                <button
                  type="button"
                  className="absolute right-2 inline-flex items-center justify-center rounded p-1 text-[color:var(--color-text-tertiary)] hover:text-[color:var(--color-text-secondary)]"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>

            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="mt-1">
              <Button type="submit" color="primary" fullWidth isLoading={loading}>
                {t("resetPassword")}
              </Button>
            </motion.div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
