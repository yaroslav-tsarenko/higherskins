"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, type ContactFormData } from "@/lib/validators/contact";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, MapPin, Clock, Send, Phone,
  CheckCircle, MessageSquare, HelpCircle, ShieldCheck,
} from "lucide-react";
import { brand, brandAddressLine } from "@/lib/brand";

const INPUT_CLASS =
  "w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] px-4 py-2.5 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-tertiary)] focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20 transition-colors";

const CONTACT_INFO = [
  { icon: Mail, title: "Email us", detail: brand.contact.email, sub: "General enquiries — reply within 24h" },
  { icon: Phone, title: "Call our team", detail: brand.contact.phone, sub: "Sales, order help & product advice" },
  { icon: MapPin, title: "Registered office", detail: `${brand.company.address.city}, ${brand.company.address.country}`, sub: `${brand.company.legalName} · Co. No. ${brand.company.number}`, tooltip: `${brandAddressLine}\nCompany No. ${brand.company.number}` },
  { icon: Clock, title: "Support hours", detail: "Mon–Fri 9:00–18:00", sub: "Sat 10:00–14:00 (GMT)" },
];

const TOPICS = [
  { icon: MessageSquare, label: "General enquiry", value: "general" },
  { icon: HelpCircle, label: "Trade & delivery", value: "support" },
  { icon: ShieldCheck, label: "Refunds & disputes", value: "returns" },
  { icon: Send, label: "Business / B2B", value: "business" },
];

export default function ContactPage() {
  const t = useTranslations("contact");
  const nav = useTranslations("nav");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("");

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
      toast.success(t("success"));
    } catch {
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[var(--max-width)] px-4 pb-16">
      <Breadcrumbs items={[{ label: nav("home"), href: "/" }, { label: t("title") }]} />

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center sm:mb-12"
      >
        <span className="eyebrow">{nav("home")} / {t("title")}</span>
        <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-[color:var(--color-text)] sm:text-[40px]">
          {t("title")}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-base text-[color:var(--color-text-secondary)] sm:text-lg">
          {t("subtitle")}. We&apos;re here to help with orders, products, and any questions you may have.
        </p>
      </motion.div>

      {/* Contact Info Cards */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 grid grid-cols-2 gap-3 sm:mb-12 sm:gap-4 lg:grid-cols-4"
      >
        {CONTACT_INFO.map((info, i) => (
          <motion.div
            key={info.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-4 text-center sm:p-6"
            whileHover={{ y: -4 }}
          >
            <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]">
              <info.icon size={22} strokeWidth={1.5} />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-[color:var(--color-text)]">{info.title}</h3>
            <p
              title={"tooltip" in info ? info.tooltip : undefined}
              className={`mb-1 text-sm font-medium text-[color:var(--color-text)] ${"tooltip" in info ? "cursor-help" : ""}`}
            >
              {info.detail}
            </p>
            <p className="text-xs text-[color:var(--color-text-tertiary)]">{info.sub}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content: Form + Sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px] lg:items-start lg:gap-10">
        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-5 sm:p-8"
        >
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="px-4 py-12 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", damping: 12, stiffness: 300 }}
                >
                  <CheckCircle size={64} className="mx-auto mb-6 text-[color:var(--color-success)]" strokeWidth={1.5} />
                </motion.div>
                <h2 className="mb-3 font-serif text-2xl font-medium tracking-tight text-[color:var(--color-text)]">Message Sent!</h2>
                <p className="mx-auto mb-6 max-w-xs text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                  {t("success")}
                </p>
                <Button color="primary" onPress={() => setSubmitted(false)}>
                  Send Another Message
                </Button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-5"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--color-accent-tint)] text-[color:var(--color-accent)]">
                    <Send size={16} />
                  </div>
                  <h2 className="font-serif text-xl font-medium tracking-tight text-[color:var(--color-text)]">Send us a message</h2>
                </div>

                {/* Topic Selector */}
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[color:var(--color-text-secondary)]">What can we help with?</label>
                  <div className="grid grid-cols-1 gap-2 xs:grid-cols-2 sm:grid-cols-2">
                    {TOPICS.map((topic) => {
                      const isActive = selectedTopic === topic.value;
                      return (
                        <button
                          key={topic.value}
                          type="button"
                          onClick={() => {
                            setSelectedTopic(topic.value);
                            setValue("subject", topic.label);
                          }}
                          className={`flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-[13px] transition-all ${
                            isActive
                              ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary-tint)] font-semibold text-[color:var(--color-primary)]"
                              : "border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] text-[color:var(--color-text-secondary)] hover:border-[color:var(--color-line-strong)]"
                          }`}
                        >
                          <topic.icon size={15} />
                          {topic.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-[color:var(--color-text-secondary)]">{t("name")}</label>
                    <input
                      className={INPUT_CLASS}
                      placeholder="John Doe"
                      {...register("name")}
                    />
                    {errors.name && <span className="mt-1 block text-xs text-[color:var(--color-danger)]">{errors.name.message}</span>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-[color:var(--color-text-secondary)]">{t("email")}</label>
                    <div className="relative">
                      <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-text-tertiary)]" />
                      <input
                        className={`${INPUT_CLASS} pl-11`}
                        type="email"
                        placeholder="your@email.com"
                        {...register("email")}
                      />
                    </div>
                    {errors.email && <span className="mt-1 block text-xs text-[color:var(--color-danger)]">{errors.email.message}</span>}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[color:var(--color-text-secondary)]">{t("subject")}</label>
                  <input
                    className={INPUT_CLASS}
                    placeholder="How can we help?"
                    {...register("subject")}
                  />
                  {errors.subject && <span className="mt-1 block text-xs text-[color:var(--color-danger)]">{errors.subject.message}</span>}
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[color:var(--color-text-secondary)]">{t("message")}</label>
                  <textarea
                    className={`${INPUT_CLASS} resize-y leading-relaxed`}
                    rows={5}
                    placeholder="Tell us more about your question or concern..."
                    {...register("message")}
                  />
                  {errors.message && <span className="mt-1 block text-xs text-[color:var(--color-danger)]">{errors.message.message}</span>}
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    color="primary"
                    size="lg"
                    isLoading={loading}
                    fullWidth
                    startContent={!loading ? <Send size={16} /> : undefined}
                  >
                    {t("send")}
                  </Button>
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-5"
        >
          {/* FAQ Teaser */}
          <div className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-6">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-[color:var(--color-text)]">
              <HelpCircle size={18} className="text-[color:var(--color-accent)]" />
              Frequently Asked
            </h3>
            <div className="flex flex-col gap-3">
              {[
                { q: "How fast is skin delivery?", a: "Usually seconds — our bot sends the trade offer the moment payment clears." },
                { q: "Can I get a refund?", a: "Yes, if the trade offer hasn't been sent. Once delivered, trades are final." },
                { q: "Why is there a trade hold?", a: "Steam holds trades when Mobile Guard isn't active. Buy from verified sellers to avoid it." },
                { q: "How do I track my purchase?", a: "Check Account → My Trades for a live delivery status." },
              ].map((faq, i) => (
                <div key={i} className="rounded-lg bg-[color:var(--color-bg-secondary)] p-3 text-[13px]">
                  <p className="mb-1 font-semibold text-[color:var(--color-text)]">{faq.q}</p>
                  <p className="leading-relaxed text-[color:var(--color-text-tertiary)]">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Response Time */}
          <div className="rounded-2xl bg-[color:var(--color-primary)] p-6 text-[color:var(--color-primary-fg)]">
            <div className="mb-3.5 flex items-center gap-2">
              <Clock size={18} className="text-[color:var(--color-accent)]" />
              <h3 className="text-[15px] font-semibold">Response Times</h3>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between text-[13px]">
                <span className="opacity-70">General email</span>
                <span className="font-semibold">Within 24h</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="opacity-70">Wholesale (B2B)</span>
                <span className="font-semibold">Within 48h</span>
              </div>
            </div>
          </div>

          {/* Trust */}
          <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-5">
            <ShieldCheck size={20} className="shrink-0 text-[color:var(--color-success)]" strokeWidth={1.5} />
            <p className="text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
              Your information is secure and will only be used to respond to your inquiry. We never share your data.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
