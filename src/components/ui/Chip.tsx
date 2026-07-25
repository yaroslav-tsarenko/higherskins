import React from "react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

type ChipColor = "default" | "primary" | "secondary" | "success" | "warning" | "danger" | "accent";
type ChipVariant = "solid" | "flat" | "faded" | "bordered" | "light" | "dot";
type ChipSize = "sm" | "md" | "lg";

interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: ChipColor;
  variant?: ChipVariant;
  size?: ChipSize;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  isCloseable?: boolean;
  onClose?: () => void;
}

/**
 * Higherskins Chip — replaces HeroUI's Chip.
 * Editorial pill: soft warm-toned surfaces, hairline borders.
 */
export function Chip({
  color = "default",
  variant = "flat",
  size = "md",
  startContent,
  endContent,
  isCloseable,
  onClose,
  className,
  children,
  ...rest
}: ChipProps) {
  const sizes: Record<ChipSize, string> = {
    sm: "h-6 px-2 text-[11px]",
    md: "h-7 px-2.5 text-xs",
    lg: "h-8 px-3 text-sm",
  };

  const palettes: Record<ChipColor, { solid: string; flat: string; bordered: string }> = {
    default: {
      solid: "bg-[color:var(--color-text)] text-[color:var(--color-bg)] border border-transparent",
      flat: "bg-[color:var(--color-bg-secondary)] text-[color:var(--color-text)] border border-transparent",
      bordered: "bg-transparent text-[color:var(--color-text)] border border-[color:var(--color-border)]",
    },
    primary: {
      solid: "bg-[color:var(--color-primary)] text-white border border-transparent",
      flat: "bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)] border border-transparent",
      bordered: "bg-transparent text-[color:var(--color-primary)] border border-[color:var(--color-primary)]/50",
    },
    secondary: {
      solid: "bg-[color:var(--color-primary)] text-white border border-transparent",
      flat: "bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)] border border-transparent",
      bordered: "bg-transparent text-[color:var(--color-primary)] border border-[color:var(--color-primary)]/40",
    },
    accent: {
      solid: "bg-[color:var(--color-accent)] text-white border border-transparent",
      flat: "bg-[color:var(--color-accent-tint)] text-[color:var(--color-accent)] border border-transparent",
      bordered: "bg-transparent text-[color:var(--color-accent)] border border-[color:var(--color-accent)]/50",
    },
    success: {
      solid: "bg-[color:var(--color-success)] text-white border border-transparent",
      flat: "bg-[color:var(--color-success-light)] text-[color:var(--color-success)] border border-transparent",
      bordered: "bg-transparent text-[color:var(--color-success)] border border-[color:var(--color-success)]/40",
    },
    warning: {
      solid: "bg-[color:var(--color-warning)] text-white border border-transparent",
      flat: "bg-[color:var(--color-warning-light)] text-[color:var(--color-warning)] border border-transparent",
      bordered: "bg-transparent text-[color:var(--color-warning)] border border-[color:var(--color-warning)]/40",
    },
    danger: {
      solid: "bg-[color:var(--color-danger)] text-white border border-transparent",
      flat: "bg-[color:var(--color-danger-light)] text-[color:var(--color-danger)] border border-transparent",
      bordered: "bg-transparent text-[color:var(--color-danger)] border border-[color:var(--color-danger)]/40",
    },
  };

  const resolvedVariant: keyof (typeof palettes)[ChipColor] =
    variant === "solid" ? "solid"
    : variant === "bordered" ? "bordered"
    : "flat";

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center gap-1.5 rounded-full font-medium leading-none tracking-wide",
          sizes[size],
          palettes[color][resolvedVariant],
          className,
        ),
      )}
      {...rest}
    >
      {variant === "dot" && (
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--color-success)]"
        />
      )}
      {startContent}
      {children}
      {endContent}
      {isCloseable && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Remove"
          className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full opacity-70 hover:opacity-100"
        >
          ×
        </button>
      )}
    </span>
  );
}
