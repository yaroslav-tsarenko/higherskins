"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Mail, Lock, Eye, EyeOff, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function LoginPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      toast.success("Logged in successfully!");
      if (data.user?.role === "ADMIN" || data.user?.role === "SUPER_ADMIN") {
        window.location.href = "/admin";
      } else {
        window.location.href = `/${locale}/account`;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
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
          <h1 className="mb-2 font-serif text-3xl font-medium tracking-tight text-[color:var(--color-text)]">{t("loginTitle")}</h1>
          <p className="text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">{t("loginSubtitle")}</p>
        </motion.div>

        <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
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

          <motion.div className="flex flex-col gap-1.5" custom={2} variants={fadeUp} initial="hidden" animate="visible">
            <label className="text-[13px] font-medium text-[color:var(--color-text-secondary)]">{t("password")}</label>
            <div className="relative flex items-center">
              <Lock size={16} className="pointer-events-none absolute left-3 z-10 text-[color:var(--color-text-tertiary)]" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
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

          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
            <Link href="/auth/forgot-password" className="block text-right text-[13px] font-medium text-[color:var(--color-accent)] hover:opacity-80">
              {t("forgotPassword")}
            </Link>
          </motion.div>

          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="mt-1">
            <Button type="submit" color="primary" fullWidth isLoading={loading}>
              {t("signIn")}
            </Button>
          </motion.div>
        </form>

        <motion.p className="mt-7 text-center text-sm text-[color:var(--color-text-secondary)]" custom={5} variants={fadeUp} initial="hidden" animate="visible">
          {t("noAccount")}{" "}
          <Link href="/auth/register" className="font-semibold text-[color:var(--color-accent)] hover:opacity-80">
            {t("signUp")}
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
