"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Check, ShoppingCart } from "lucide-react";

interface CartToastProps {
  name: string;
  imageUrl?: string | null;
  quantity: number;
}

export function CartToast({ name, imageUrl, quantity }: CartToastProps) {
  return (
    <motion.div
      className="relative flex min-w-[320px] max-w-[380px] items-center gap-3.5 overflow-hidden rounded-2xl border border-[color:var(--color-line)] border-l-[3px] border-l-[color:var(--color-success)] bg-[color:var(--color-bg-elevated)] px-4 py-3.5 shadow-[0_16px_32px_-8px_rgba(28,26,23,0.12),0_6px_12px_-4px_rgba(28,26,23,0.06)]"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 350 }}
    >
      <motion.div
        className="relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[color:var(--color-success)] text-white shadow-[0_4px_10px_rgba(78,122,99,0.35)]"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", damping: 15, stiffness: 400 }}
      >
        <Check size={14} strokeWidth={3} />
      </motion.div>

      <div className="relative z-10 flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[color:var(--color-line)] bg-white text-[color:var(--color-text-tertiary)]">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill sizes="52px" className="object-contain" />
        ) : (
          <ShoppingCart size={20} />
        )}
      </div>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--color-success)]">Added to cart</span>
        <span className="truncate text-sm font-semibold leading-[1.3] text-[color:var(--color-text)]">{name}</span>
        {quantity > 1 && <span className="text-xs font-medium text-[color:var(--color-text-secondary)]">Qty: {quantity}</span>}
      </div>
    </motion.div>
  );
}
