"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import {
  Mail, Lock, Eye, EyeOff, User, ShoppingBag,
  Phone, MapPin, Calendar, ChevronRight, ChevronLeft, Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { COUNTRIES } from "@/lib/countries";

function getPasswordStrength(password: string): { level: number; label: string; color: string } {
  if (password.length === 0) return { level: 0, label: "", color: "transparent" };
  if (password.length < 6) return { level: 25, label: "Weak", color: "var(--color-danger)" };
  if (password.length < 10) return { level: 50, label: "Fair", color: "var(--color-warning)" };
  if (password.length < 14) return { level: 75, label: "Good", color: "var(--color-success)" };
  return { level: 100, label: "Strong", color: "var(--color-success)" };
}

const STEP_LABELS = ["Personal Info", "Contact Details", "Address", "Password"];
const STEP_ICONS = [User, Phone, MapPin, Lock];

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  country: string;
  postalCode: string;
  dateOfBirth: string;
  password: string;
  confirmPassword: string;
}

const initialForm: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  country: "",
  postalCode: "",
  dateOfBirth: "",
  password: "",
  confirmPassword: "",
};

const INPUT_ICON_CLASS =
  "w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] py-2.5 pl-10 pr-3 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-tertiary)] focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20";

const INPUT_PLAIN_CLASS =
  "w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] px-3 py-2.5 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-tertiary)] focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [policyError, setPolicyError] = useState(false);

  const strength = getPasswordStrength(form.password);

  const selectedCountry = COUNTRIES.find((c) => c.code === form.country);
  const phoneHint = selectedCountry ? selectedCountry.phone : "+44";

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  function validateStep(s: number): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (s === 0) {
      if (!form.firstName.trim()) errs.firstName = "First name is required";
      if (!form.lastName.trim()) errs.lastName = "Last name is required";
      if (!form.dateOfBirth) errs.dateOfBirth = "Date of birth is required";
      else {
        const dob = new Date(form.dateOfBirth);
        const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        if (age < 18) errs.dateOfBirth = "You must be at least 18 years old";
      }
    } else if (s === 1) {
      if (!form.email.trim()) errs.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email";
      if (!form.phone.trim()) errs.phone = "Phone is required";
    } else if (s === 2) {
      if (!form.street.trim()) errs.street = "Street address is required";
      if (!form.city.trim()) errs.city = "City is required";
      if (!form.country) errs.country = "Country is required";
      if (!form.postalCode.trim()) errs.postalCode = "Postal code is required";
    } else if (s === 3) {
      if (!form.password) errs.password = "Password is required";
      else if (form.password.length < 6) errs.password = "Min 6 characters";
      if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const goNext = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 3));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    if (!agreedToPolicy) {
      setPolicyError(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          street: form.street,
          city: form.city,
          country: form.country,
          postalCode: form.postalCode,
          dateOfBirth: form.dateOfBirth,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      toast.success("Account created!");
      window.location.href = "/account";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const stepVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  const renderError = (field: keyof FormData) =>
    errors[field] ? (
      <span className="mt-1 block text-xs text-[color:var(--color-danger)]">{errors[field]}</span>
    ) : null;

  const errorBorder = (field: keyof FormData) =>
    errors[field] ? "!border-[color:var(--color-danger)]" : "";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[color:var(--color-bg)] px-4 py-8">
      <motion.div
        className="relative w-full max-w-[480px] rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-8 shadow-sm sm:p-10"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--color-primary)] text-white">
            <ShoppingBag size={24} strokeWidth={1.5} />
          </div>
          <h1 className="mb-2 font-serif text-3xl font-medium tracking-tight text-[color:var(--color-text)]">{t("registerTitle")}</h1>
          <p className="text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">{t("registerSubtitle")}</p>
        </div>

        {/* Welcome gift banner */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-[color:var(--color-success)]/30 bg-[color:var(--color-success)]/10 p-3 text-[13px]">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-success)] text-sm font-bold text-white">
            10%
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[color:var(--color-success)]">Welcome gift: 10% off</div>
            <div className="text-xs text-[color:var(--color-text-secondary)]">Auto-applied to your first order at checkout.</div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="mb-7 flex items-center gap-1">
          {STEP_LABELS.map((label, i) => {
            const Icon = STEP_ICONS[i];
            const isActive = i === step;
            const isDone = i < step;
            return (
              <button
                key={i}
                type="button"
                onClick={() => i < step && setStep(i)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border-none px-1 py-2 text-[11px] transition-all ${
                  i <= step ? "cursor-pointer" : "cursor-default"
                } ${
                  isActive
                    ? "bg-[color:var(--color-primary-tint)] font-bold text-[color:var(--color-primary)]"
                    : isDone
                    ? "font-medium text-[color:var(--color-primary)]"
                    : "font-medium text-[color:var(--color-text-tertiary)]"
                }`}
              >
                {isDone ? (
                  <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[color:var(--color-primary)] text-white">
                    <Check size={10} strokeWidth={3} />
                  </div>
                ) : (
                  <Icon size={14} />
                )}
                <span className="sr-only">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mb-5 flex gap-2">
          {STEP_LABELS.map((_, i) => (
            <div
              key={i}
              className={`h-[3px] flex-1 rounded-full transition-colors ${
                i <= step ? "bg-[color:var(--color-primary)]" : "bg-[color:var(--color-line)]"
              }`}
            />
          ))}
        </div>

        <p className="mb-4 text-[13px] font-semibold text-[color:var(--color-text-secondary)]">
          Step {step + 1} of 4: {STEP_LABELS[step]}
        </p>

        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[color:var(--color-text-secondary)]">First Name *</label>
                  <div className="relative flex items-center">
                    <User size={16} className="pointer-events-none absolute left-3 z-10 text-[color:var(--color-text-tertiary)]" />
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={set("firstName")}
                      placeholder="John"
                      className={`${INPUT_ICON_CLASS} ${errorBorder("firstName")}`}
                    />
                  </div>
                  {renderError("firstName")}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[color:var(--color-text-secondary)]">Last Name *</label>
                  <div className="relative flex items-center">
                    <User size={16} className="pointer-events-none absolute left-3 z-10 text-[color:var(--color-text-tertiary)]" />
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={set("lastName")}
                      placeholder="Doe"
                      className={`${INPUT_ICON_CLASS} ${errorBorder("lastName")}`}
                    />
                  </div>
                  {renderError("lastName")}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[color:var(--color-text-secondary)]">Date of Birth *</label>
                  <div className="relative flex items-center">
                    <Calendar size={16} className="pointer-events-none absolute left-3 z-10 text-[color:var(--color-text-tertiary)]" />
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={set("dateOfBirth")}
                      className={`${INPUT_ICON_CLASS} ${errorBorder("dateOfBirth")}`}
                    />
                  </div>
                  {renderError("dateOfBirth")}
                </div>

                <div className="mt-1">
                  <Button type="button" color="primary" fullWidth onPress={goNext} endContent={<ChevronRight size={16} />}>
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[color:var(--color-text-secondary)]">{t("email")} *</label>
                  <div className="relative flex items-center">
                    <Mail size={16} className="pointer-events-none absolute left-3 z-10 text-[color:var(--color-text-tertiary)]" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={set("email")}
                      placeholder="you@example.com"
                      className={`${INPUT_ICON_CLASS} ${errorBorder("email")}`}
                    />
                  </div>
                  {renderError("email")}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[color:var(--color-text-secondary)]">Phone *</label>
                  <div className="relative flex items-center">
                    <Phone size={16} className="pointer-events-none absolute left-3 z-10 text-[color:var(--color-text-tertiary)]" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={set("phone")}
                      placeholder={`${phoneHint} XX XXX XXXX`}
                      className={`${INPUT_ICON_CLASS} ${errorBorder("phone")}`}
                    />
                  </div>
                  {renderError("phone")}
                  {!form.country && (
                    <span className="text-[11px] text-[color:var(--color-text-tertiary)]">
                      Select country in next step for phone code hint
                    </span>
                  )}
                </div>

                <div className="mt-1 flex gap-3">
                  <Button type="button" variant="bordered" onPress={goBack} startContent={<ChevronLeft size={16} />}>
                    Back
                  </Button>
                  <Button type="button" color="primary" onPress={goNext} endContent={<ChevronRight size={16} />} className="flex-1">
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[color:var(--color-text-secondary)]">Street Address *</label>
                  <div className="relative flex items-center">
                    <MapPin size={16} className="pointer-events-none absolute left-3 z-10 text-[color:var(--color-text-tertiary)]" />
                    <input
                      type="text"
                      value={form.street}
                      onChange={set("street")}
                      placeholder="123 Main Street, Apt 4B"
                      className={`${INPUT_ICON_CLASS} ${errorBorder("street")}`}
                    />
                  </div>
                  {renderError("street")}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[color:var(--color-text-secondary)]">City *</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={set("city")}
                    placeholder="London"
                    className={`${INPUT_PLAIN_CLASS} ${errorBorder("city")}`}
                  />
                  {renderError("city")}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[color:var(--color-text-secondary)]">Country *</label>
                  <select
                    value={form.country}
                    onChange={set("country")}
                    className={`${INPUT_PLAIN_CLASS} appearance-none pr-10 bg-[right_0.75rem_center] bg-no-repeat ${errorBorder("country")}`}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2396908A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                      color: form.country ? "var(--color-text)" : "var(--color-text-tertiary)",
                    }}
                  >
                    <option value="">Select country...</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                  {renderError("country")}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[color:var(--color-text-secondary)]">Postal Code *</label>
                  <input
                    type="text"
                    value={form.postalCode}
                    onChange={set("postalCode")}
                    placeholder="CF31 1JF"
                    className={`${INPUT_PLAIN_CLASS} ${errorBorder("postalCode")}`}
                  />
                  {renderError("postalCode")}
                </div>

                <div className="mt-1 flex gap-3">
                  <Button type="button" variant="bordered" onPress={goBack} startContent={<ChevronLeft size={16} />}>
                    Back
                  </Button>
                  <Button type="button" color="primary" onPress={goNext} endContent={<ChevronRight size={16} />} className="flex-1">
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[color:var(--color-text-secondary)]">{t("password")} *</label>
                  <div className="relative flex items-center">
                    <Lock size={16} className="pointer-events-none absolute left-3 z-10 text-[color:var(--color-text-tertiary)]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={set("password")}
                      placeholder="Min 6 characters"
                      className={`${INPUT_ICON_CLASS} pr-10 ${errorBorder("password")}`}
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
                  {renderError("password")}
                  {form.password.length > 0 && (
                    <div className="mt-1.5">
                      <div className="h-1 overflow-hidden rounded-full bg-[color:var(--color-line)]">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${strength.level}%`, background: strength.color }}
                        />
                      </div>
                      <p className="mt-1 text-xs" style={{ color: strength.color }}>{strength.label}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[color:var(--color-text-secondary)]">{t("confirmPassword")} *</label>
                  <div className="relative flex items-center">
                    <Lock size={16} className="pointer-events-none absolute left-3 z-10 text-[color:var(--color-text-tertiary)]" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={set("confirmPassword")}
                      placeholder="Confirm your password"
                      className={`${INPUT_ICON_CLASS} pr-10 ${errorBorder("confirmPassword")}`}
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
                  {renderError("confirmPassword")}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed text-[color:var(--color-text-secondary)]">
                    <input
                      type="checkbox"
                      checked={agreedToPolicy}
                      onChange={(e) => {
                        setAgreedToPolicy(e.target.checked);
                        if (e.target.checked) setPolicyError(false);
                      }}
                      className={`mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-[color:var(--color-line)] accent-[color:var(--color-primary)] ${
                        policyError ? "outline outline-1 outline-[color:var(--color-danger)]" : ""
                      }`}
                    />
                    <span>
                      I agree to the{" "}
                      <Link href="/policies/terms" className="text-[color:var(--color-accent)] hover:underline">Terms of Service</Link> and{" "}
                      <Link href="/policies/privacy" className="text-[color:var(--color-accent)] hover:underline">Privacy Policy</Link>.
                    </span>
                  </label>
                  {policyError && (
                    <span className="text-xs text-[color:var(--color-danger)]">
                      You must accept the Privacy Policy to continue
                    </span>
                  )}
                </div>

                <div className="mt-1 flex gap-3">
                  <Button type="button" variant="bordered" onPress={goBack} startContent={<ChevronLeft size={16} />}>
                    Back
                  </Button>
                  <Button type="submit" color="primary" isLoading={loading} className="flex-1">
                    {t("signUp")}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <p className="mt-7 text-center text-sm text-[color:var(--color-text-secondary)]">
          {t("hasAccount")}{" "}
          <Link href="/auth/login" className="font-semibold text-[color:var(--color-accent)] hover:opacity-80">{t("signIn")}</Link>
        </p>
      </motion.div>
    </div>
  );
}
