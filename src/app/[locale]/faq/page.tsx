"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    q: "How fast do I get my skin?",
    a: "As soon as your payment clears, our bot sends a Steam trade offer to your account — usually within seconds. Just accept the offer and the skin lands in your inventory instantly.",
  },
  {
    q: "What are trade holds and why do they happen?",
    a: "Steam applies a trade hold (up to 8 days) when the seller doesn't have Steam Mobile Guard active, or hasn't had it active for at least 7 days. Buying from verified sellers with Mobile Guard means your skin arrives with no hold.",
  },
  {
    q: "Do I need a Steam trade URL?",
    a: "Yes. Your trade URL is how our bot delivers the skin to your inventory. Add it under Account → Trade URL. We validate that it belongs to your own Steam account before saving it.",
  },
  {
    q: "How do I track my purchase?",
    a: "Every purchase appears under Account → My Trades with a live status: Processing, Trade offer sent, or Delivered. You'll see exactly where your skin is in the delivery flow.",
  },
  {
    q: "How does payment work?",
    a: "Purchases are paid from your HigherSkins wallet balance. Your funds are only captured once the trade offer is confirmed, so you're covered by buyer protection on every trade.",
  },
  {
    q: "Can I cancel a purchase?",
    a: "If a trade offer hasn't been sent yet, contact support and we'll cancel and refund your balance. Once a skin has been delivered to your inventory the trade is final.",
  },
  {
    q: "What are float and pattern?",
    a: "Float is the exact wear value of a skin (lower is cleaner); pattern index determines the placement of a skin's design. Both are shown live on every listing so you know precisely what you're buying.",
  },
  {
    q: "How do I contact support?",
    a: "You can reach us via our contact form or email at info@higherskins.com. We aim to respond within 24 hours on weekdays.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[color:var(--color-line)] transition-colors ${
        open ? "bg-[color:var(--color-bg-secondary)]" : "bg-[color:var(--color-bg-elevated)]"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 border-none bg-transparent px-5 py-[1.125rem] text-left"
      >
        <span className="text-[15px] font-semibold text-[color:var(--color-text)]">{q}</span>
        <ChevronDown
          size={18}
          className="shrink-0 text-[color:var(--color-text-tertiary)] transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-[1.125rem] text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="mx-auto w-full max-w-[var(--max-width)] px-4 pb-16">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "FAQ" }]} />

      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <span className="eyebrow">Help center</span>
          <h1 className="mb-3 mt-2 break-words font-serif text-3xl font-medium tracking-tight text-[color:var(--color-text)] sm:text-[40px]">
            Frequently Asked <span className="text-[color:var(--color-accent)]">Questions</span>
          </h1>
          <p className="text-base leading-relaxed text-[color:var(--color-text-secondary)] sm:text-lg">
            Everything you need to know about buying and selling CS2 skins
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </div>
  );
}
