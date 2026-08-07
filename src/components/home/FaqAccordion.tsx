"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { Panel } from "./Section";

const ITEMS = [
  {
    q: "How fast does a trade complete?",
    a: "Most trades land within a few minutes of checkout. You receive the Steam trade offer as soon as payment clears — the item stays in escrow until you accept it.",
  },
  {
    q: "Do you ever need my Steam password or API key?",
    a: "Never. A trade URL is the only thing we ask for. Anyone requesting your password, API key or mobile authenticator code is not us.",
  },
  {
    q: "What is float and why does it change the price?",
    a: "Float is the wear value between 0 and 1 that decides how scratched a skin looks. Lower floats sit in better exterior bands and command a premium — every listing shows its exact value.",
  },
  {
    q: "How are your prices lower than Steam?",
    a: "Steam charges a 15% fee on every sale and the funds are locked to your wallet. We settle in real money and pass most of that spread back, which is where the discount on each listing comes from.",
  },
  {
    q: "Do I need a Steam account to buy?",
    a: "You can sign up and browse with just an email. A Steam account and trade URL are only needed at checkout, so our bot can deliver the skin to your inventory.",
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Panel padded={false} className="divide-y divide-[color:var(--color-border)]">
      {ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[color:var(--color-bg-secondary)]/60"
            >
              <span className="flex-1 text-[14.5px] font-bold text-[color:var(--color-text)]">
                {item.q}
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.18 }}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]"
              >
                <Plus size={15} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-[13.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </Panel>
  );
}
