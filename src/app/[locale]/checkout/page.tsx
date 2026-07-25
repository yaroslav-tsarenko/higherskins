"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/providers/CartProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { checkoutSchema, type CheckoutFormData } from "@/lib/validators/checkout";
import { formatPrice } from "@/lib/utils/format-price";
import { COUNTRIES } from "@/lib/countries";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { toast } from "sonner";
import {
  Mail, Phone, MapPin, Truck, CreditCard,
  ChevronRight, ShieldCheck, Lock, Check, ImageOff, UserPlus, Tag, X as XIcon,
} from "lucide-react";

interface AppliedDiscount {
  type: "welcome" | "newsletter";
  percent: number;
  code: string;
  source: "auto" | "code";
}

const SHIPPING_METHODS = [
  { key: "standard", label: "Standard Shipping", time: "5-7 business days", price: 5.99, icon: Truck },
  { key: "express", label: "Express Shipping", time: "2-3 business days", price: 12.99, icon: Truck },
  { key: "free", label: "Economy Shipping", time: "7-14 business days", price: 0, icon: Truck },
];

const stepIcons = [Mail, MapPin, CreditCard];
const stepVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

const INPUT_ICON =
  "w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] py-3 pl-11 pr-4 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-tertiary)] focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20 transition-colors";
const INPUT_PLAIN =
  "w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] px-4 py-3 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-tertiary)] focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20 transition-colors";
const LABEL = "mb-1.5 block text-[13px] font-semibold text-[color:var(--color-text-secondary)]";
const ERROR = "mt-1 flex items-center gap-1 text-xs text-[color:var(--color-danger)]";

function InputWithIcon({ icon: Icon, error, ...props }: { icon: React.ElementType; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Icon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-text-tertiary)]" />
      <input
        {...props}
        className={`${INPUT_ICON} ${error ? "!border-[color:var(--color-danger)]" : ""}`}
      />
      {error && <span className={ERROR}>{error}</span>}
    </div>
  );
}

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const nav = useTranslations("nav");
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const { currency, convert } = useCurrency();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [discount, setDiscount] = useState<AppliedDiscount | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      contact: { email: user?.email || "", phone: "" },
      shipping: {
        firstName: "",
        lastName: "",
        address1: "",
        address2: "",
        city: "",
        province: "",
        postalCode: "",
        country: "",
      },
      shippingMethod: "standard",
    },
  });

  const steps = [t("contact"), t("shipping"), t("review")];
  const selectedMethod = watch("shippingMethod");
  const selectedCountry = watch("shipping.country");
  const availableMethods = cart.subtotal >= 100
    ? SHIPPING_METHODS
    : SHIPPING_METHODS.filter((m) => m.key !== "free");
  const shippingPrice = SHIPPING_METHODS.find((m) => m.key === selectedMethod)?.price ?? 5.99;

  const countryData = COUNTRIES.find((c) => c.code === selectedCountry);
  const phoneHint = countryData ? `${countryData.phone} XX XXX XXXX` : "+44 XX XXX XXXX";

  const discountAmount = discount ? +(cart.subtotal * (discount.percent / 100)).toFixed(2) : 0;
  const discountedSubtotal = Math.max(cart.subtotal - discountAmount, 0);
  const taxOnDiscounted = +(discountedSubtotal * 0.21).toFixed(2);
  const finalShipping = discountedSubtotal >= 100 && selectedMethod === "free" ? 0 : shippingPrice;

  useEffect(() => {
    let cancelled = false;
    if (user) {
      fetch("/api/discounts")
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled && d?.discount) setDiscount(d.discount);
        })
        .catch(() => null);
    }
    return () => { cancelled = true; };
  }, [user]);

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setApplyingPromo(true);
    setPromoError(null);
    try {
      const r = await fetch(`/api/discounts?code=${encodeURIComponent(code)}`);
      const data = await r.json();
      if (data?.discount) {
        setDiscount(data.discount);
        setPromoInput("");
        toast.success(`${data.discount.percent}% discount applied!`);
      } else {
        setPromoError("Invalid or expired code");
      }
    } catch {
      setPromoError("Failed to apply code");
    } finally {
      setApplyingPromo(false);
    }
  };

  const removeDiscount = () => {
    setDiscount(null);
    setPromoError(null);
  };

  const goNext = async () => {
    if (step === 0) {
      const valid = await trigger("contact");
      if (!valid) return;
    } else if (step === 1) {
      const valid = await trigger(["shipping", "shippingMethod"]);
      if (!valid) return;
    }
    setStep((s) => Math.min(s + 1, 2));
  };

  const onSubmit = async (data: CheckoutFormData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          discountCode: discount?.source === "code" ? discount.code : undefined,
          items: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            variantName: item.variantName,
          })),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Order failed");
      }

      const orderData = await res.json();
      clearCart();

      if (orderData.redirectUrl) {
        toast.success("Redirecting to payment page...");
        window.location.href = orderData.redirectUrl;
      } else {
        toast.success("Order placed successfully!");
        router.push(`/order/confirmed?orderId=${orderData.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (cart.items.length === 0) {
      router.push("/cart");
    }
  }, [cart.items.length, router]);

  if (cart.items.length === 0) return null;

  const freeShippingThreshold = convert(100);
  const subtotalConverted = convert(cart.subtotal);
  const amountToFreeShipping = freeShippingThreshold - subtotalConverted;

  return (
    <div className="mx-auto w-full max-w-[var(--max-width)] px-4 pb-16">
      <Breadcrumbs items={[{ label: nav("home"), href: "/" }, { label: nav("cart"), href: "/cart" }, { label: t("title") }]} />

      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 font-serif text-3xl font-medium tracking-tight text-[color:var(--color-text)] sm:mb-6 sm:text-[40px]"
      >
        {t("title")}
      </motion.h1>

      {/* Guest checkout notice */}
      {!user && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3 rounded-xl border border-[color:var(--color-accent)]/30 bg-[color:var(--color-accent-tint)] px-5 py-3.5 text-sm text-[color:var(--color-text)]"
        >
          <UserPlus size={18} className="shrink-0 text-[color:var(--color-accent)]" />
          <span>
            Checking out as guest.{" "}
            <Link href="/auth/login" className="font-semibold text-[color:var(--color-accent)] hover:underline">
              Log in
            </Link>{" "}
            or{" "}
            <Link href="/auth/register" className="font-semibold text-[color:var(--color-accent)] hover:underline">
              create an account
            </Link>{" "}
            to track orders easily.
          </span>
        </motion.div>
      )}

      {/* Step Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 flex items-center rounded-2xl bg-[color:var(--color-bg-secondary)] p-1 sm:mb-8"
      >
        {steps.map((s, i) => {
          const Icon = stepIcons[i];
          const isActive = i === step;
          const isDone = i < step;
          return (
            <button
              key={i}
              onClick={() => i < step && setStep(i)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-none px-4 py-3 text-[13px] transition-all ${
                i <= step ? "cursor-pointer" : "cursor-default"
              } ${
                isActive
                  ? "bg-[color:var(--color-bg-elevated)] font-bold text-[color:var(--color-text)] shadow-sm"
                  : isDone
                  ? "font-medium text-[color:var(--color-primary)]"
                  : "font-medium text-[color:var(--color-text-tertiary)]"
              }`}
            >
              {isDone ? (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--color-primary)] text-white">
                  <Check size={12} strokeWidth={3} />
                </div>
              ) : (
                <Icon size={16} />
              )}
              <span className="hidden sm:inline">{s}</span>
            </button>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_380px] lg:gap-10">
        {/* Form Section */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="contact"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-4 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-5 sm:gap-5 sm:p-8"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--color-accent-tint)] text-[color:var(--color-accent)]">
                    <Mail size={16} />
                  </div>
                  <h2 className="font-serif text-xl font-medium tracking-tight text-[color:var(--color-text)]">{t("contact")}</h2>
                </div>
                <div>
                  <label className={LABEL}>{t("email")} *</label>
                  <InputWithIcon
                    icon={Mail}
                    placeholder="your@email.com"
                    error={errors.contact?.email?.message}
                    {...register("contact.email")}
                  />
                  {!user && (
                    <span className="mt-1 block text-xs text-[color:var(--color-text-tertiary)]">
                      Order confirmation will be sent to this email
                    </span>
                  )}
                </div>
                <div>
                  <label className={LABEL}>{t("phone")}</label>
                  <InputWithIcon
                    icon={Phone}
                    placeholder={phoneHint}
                    error={errors.contact?.phone?.message}
                    {...register("contact.phone")}
                  />
                  <span className="mt-1 block text-xs text-[color:var(--color-text-tertiary)]">
                    Include country code (e.g. +44, +371, +49)
                  </span>
                </div>
                <Button color="primary" size="lg" onPress={goNext} className="mt-1" endContent={<ChevronRight size={16} />}>
                  Continue to Shipping
                </Button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="shipping"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-4 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-5 sm:gap-5 sm:p-8"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--color-accent-tint)] text-[color:var(--color-accent)]">
                    <MapPin size={16} />
                  </div>
                  <h2 className="font-serif text-xl font-medium tracking-tight text-[color:var(--color-text)]">{t("shipping")}</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LABEL}>{t("firstName")} *</label>
                    <input className={`${INPUT_PLAIN} ${errors.shipping?.firstName ? "!border-[color:var(--color-danger)]" : ""}`} placeholder="John" {...register("shipping.firstName")} />
                    {errors.shipping?.firstName && <span className={ERROR}>{errors.shipping.firstName.message}</span>}
                  </div>
                  <div>
                    <label className={LABEL}>{t("lastName")} *</label>
                    <input className={`${INPUT_PLAIN} ${errors.shipping?.lastName ? "!border-[color:var(--color-danger)]" : ""}`} placeholder="Doe" {...register("shipping.lastName")} />
                    {errors.shipping?.lastName && <span className={ERROR}>{errors.shipping.lastName.message}</span>}
                  </div>
                </div>

                <div>
                  <label className={LABEL}>{t("address")} *</label>
                  <InputWithIcon icon={MapPin} placeholder="123 Main Street" error={errors.shipping?.address1?.message} {...register("shipping.address1")} />
                </div>
                <div>
                  <label className={LABEL}>{t("apartment")}</label>
                  <input className={INPUT_PLAIN} placeholder="Apt 4B (optional)" {...register("shipping.address2")} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LABEL}>{t("city")} *</label>
                    <input className={`${INPUT_PLAIN} ${errors.shipping?.city ? "!border-[color:var(--color-danger)]" : ""}`} placeholder="London" {...register("shipping.city")} />
                    {errors.shipping?.city && <span className={ERROR}>{errors.shipping.city.message}</span>}
                  </div>
                  <div>
                    <label className={LABEL}>{t("province")}</label>
                    <input className={INPUT_PLAIN} placeholder="Region (optional)" {...register("shipping.province")} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LABEL}>{t("postalCode")} *</label>
                    <input className={`${INPUT_PLAIN} ${errors.shipping?.postalCode ? "!border-[color:var(--color-danger)]" : ""}`} placeholder="CF31 1JF" {...register("shipping.postalCode")} />
                    {errors.shipping?.postalCode && <span className={ERROR}>{errors.shipping.postalCode.message}</span>}
                  </div>
                  <div>
                    <label className={LABEL}>{t("country")} *</label>
                    <select
                      className={`${INPUT_PLAIN} appearance-none pr-10 ${errors.shipping?.country ? "!border-[color:var(--color-danger)]" : ""}`}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2396908A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 0.75rem center",
                      }}
                      {...register("shipping.country")}
                    >
                      <option value="">Select country...</option>
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                    {errors.shipping?.country && <span className={ERROR}>{errors.shipping.country.message}</span>}
                  </div>
                </div>

                {/* Shipping Method Cards */}
                <div>
                  <label className="mb-3 block text-[13px] font-semibold text-[color:var(--color-text-secondary)]">{t("shippingMethod")}</label>
                  <div className="flex flex-col gap-2.5">
                    {availableMethods.map((m) => {
                      const isSelected = selectedMethod === m.key;
                      return (
                        <label
                          key={m.key}
                          className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all ${
                            isSelected
                              ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary-tint)]"
                              : "border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] hover:border-[color:var(--color-line-strong)]"
                          }`}
                        >
                          <input type="radio" value={m.key} {...register("shippingMethod")} className="hidden" />
                          <div
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              isSelected ? "border-[color:var(--color-primary)]" : "border-[color:var(--color-line-strong)]"
                            }`}
                          >
                            {isSelected && <div className="h-2 w-2 rounded-full bg-[color:var(--color-primary)]" />}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-[color:var(--color-text)]">{m.label}</div>
                            <div className="text-xs text-[color:var(--color-text-tertiary)]">{m.time}</div>
                          </div>
                          <span className={`text-sm font-bold ${m.price === 0 ? "text-[color:var(--color-success)]" : "text-[color:var(--color-text)]"}`}>
                            {m.price === 0 ? "Free" : formatPrice(convert(m.price), currency)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-1 flex gap-3">
                  <Button variant="bordered" size="lg" onPress={() => setStep(0)}>
                    Back
                  </Button>
                  <Button color="primary" size="lg" onPress={goNext} className="flex-1" endContent={<ChevronRight size={16} />}>
                    Review Order
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="review"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-4 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-5 sm:gap-5 sm:p-8"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--color-accent-tint)] text-[color:var(--color-accent)]">
                    <CreditCard size={16} />
                  </div>
                  <h2 className="font-serif text-xl font-medium tracking-tight text-[color:var(--color-text)]">{t("review")}</h2>
                </div>

                {/* Order Items */}
                <div className="flex flex-col">
                  {cart.items.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex items-center gap-4 py-3.5 ${
                        i < cart.items.length - 1 ? "border-b border-[color:var(--color-line)]" : ""
                      }`}
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[color:var(--color-line)] bg-white">
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt={item.name} fill sizes="56px" className="object-contain p-1" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[color:var(--color-text-tertiary)]">
                            <ImageOff size={18} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold text-[color:var(--color-text)]">{item.name}</div>
                        <div className="text-xs text-[color:var(--color-text-tertiary)]">Qty: {item.quantity}</div>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-[color:var(--color-text)]">
                        {formatPrice(convert(item.price * item.quantity), currency)}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-1 flex gap-3">
                  <Button variant="bordered" size="lg" onPress={() => setStep(1)}>
                    Back
                  </Button>
                  <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      color="primary"
                      size="lg"
                      isLoading={submitting}
                      fullWidth
                      startContent={!submitting ? <Lock size={16} /> : undefined}
                    >
                      {t("placeOrder")}
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Order Summary Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-6 max-lg:order-first lg:sticky lg:top-[calc(var(--header-height)+var(--announcement-height)+1rem)]"
        >
          <h3 className="mb-5 font-serif text-xl font-medium tracking-tight text-[color:var(--color-text)]">{t("orderSummary")}</h3>

          {/* Free shipping progress */}
          {amountToFreeShipping > 0 && (
            <div className="mb-5 rounded-lg bg-[color:var(--color-bg-secondary)] p-3 text-[13px]">
              <div className="mb-2 flex items-center gap-2">
                <Truck size={14} className="text-[color:var(--color-accent)]" />
                <span>Add <strong>{formatPrice(amountToFreeShipping, currency)}</strong> more for free shipping</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-[color:var(--color-line)]">
                <div
                  className="h-full rounded-full bg-[color:var(--color-accent)] transition-all duration-300"
                  style={{ width: `${Math.min((subtotalConverted / freeShippingThreshold) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Mini item list */}
          <div className="mb-5 flex flex-col gap-2.5 border-b border-[color:var(--color-line)] pb-5">
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[color:var(--color-line)] bg-white">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} fill sizes="40px" className="object-contain p-0.5" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[color:var(--color-text-tertiary)]">
                      <ImageOff size={14} />
                    </div>
                  )}
                  <div className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[color:var(--color-text-secondary)] text-[10px] font-bold text-white">
                    {item.quantity}
                  </div>
                </div>
                <span className="min-w-0 flex-1 truncate text-xs text-[color:var(--color-text-secondary)]">
                  {item.name}
                </span>
                <span className="shrink-0 text-xs font-semibold text-[color:var(--color-text)]">
                  {formatPrice(convert(item.price * item.quantity), currency)}
                </span>
              </div>
            ))}
          </div>

          {/* Promo / discount block */}
          <div className="mb-4 border-b border-[color:var(--color-line)] pb-4">
            {discount ? (
              <div className="flex items-center gap-2 rounded-lg border border-[color:var(--color-success)]/30 bg-[color:var(--color-success)]/10 px-3 py-2.5 text-[13px]">
                <Tag size={14} className="shrink-0 text-[color:var(--color-success)]" />
                <div className="flex-1">
                  <div className="font-bold text-[color:var(--color-success)]">
                    {discount.percent}% OFF applied
                  </div>
                  <div className="text-[11px] text-[color:var(--color-success)]/80">
                    {discount.type === "welcome" ? "Welcome discount" : `Code: ${discount.code}`}
                  </div>
                </div>
                {discount.source === "code" && (
                  <button
                    type="button"
                    onClick={removeDiscount}
                    aria-label="Remove discount"
                    className="flex items-center border-none bg-transparent p-1 text-[color:var(--color-success)]"
                  >
                    <XIcon size={14} />
                  </button>
                )}
              </div>
            ) : (
              <div>
                <label className={LABEL}>Promo code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null); }}
                    placeholder="NEWS-XXXXXX"
                    className={`${INPUT_PLAIN} tracking-wider`}
                  />
                  <button
                    type="button"
                    onClick={applyPromo}
                    disabled={!promoInput.trim() || applyingPromo}
                    className={`rounded-xl border-none bg-[color:var(--color-accent)] px-3.5 text-[13px] font-semibold text-white transition-opacity ${
                      promoInput.trim() && !applyingPromo ? "cursor-pointer opacity-100 hover:bg-[color:var(--color-accent-hover)]" : "cursor-not-allowed opacity-50"
                    }`}
                  >
                    {applyingPromo ? "…" : "Apply"}
                  </button>
                </div>
                {promoError && <span className={ERROR}>{promoError}</span>}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-[color:var(--color-text-secondary)]">Subtotal</span>
              <span className="font-medium text-[color:var(--color-text)]">{formatPrice(convert(cart.subtotal), currency)}</span>
            </div>
            {discount && (
              <div className="flex justify-between text-[color:var(--color-success)]">
                <span>Discount ({discount.percent}%)</span>
                <span className="font-semibold">−{formatPrice(convert(discountAmount), currency)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[color:var(--color-text-secondary)]">Shipping</span>
              <span className={`font-medium ${finalShipping === 0 ? "text-[color:var(--color-success)]" : "text-[color:var(--color-text)]"}`}>
                {finalShipping > 0 ? formatPrice(convert(finalShipping), currency) : "Free"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[color:var(--color-text-secondary)]">Tax (21%)</span>
              <span className="font-medium text-[color:var(--color-text)]">{formatPrice(convert(taxOnDiscounted), currency)}</span>
            </div>
            <div className="mt-1.5 flex justify-between border-t-2 border-[color:var(--color-line)] pt-3.5 text-lg font-bold text-[color:var(--color-text)]">
              <span>Total</span>
              <span>{formatPrice(convert(discountedSubtotal + taxOnDiscounted + finalShipping), currency)}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-2 border-t border-[color:var(--color-line)] pt-5">
            <div className="flex items-center gap-1.5 text-xs text-[color:var(--color-text-tertiary)]">
              <ShieldCheck size={14} />
              Secure checkout with SSL encryption
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[color:var(--color-text-tertiary)]">
              <Lock size={14} />
              Your data is protected
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
