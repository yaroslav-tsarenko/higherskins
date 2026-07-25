"use client";

import React from "react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "danger-soft" | "light" | "flat" | "bordered" | "tertiary";
type Color = "primary" | "danger" | "success" | "warning" | "default";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  variant?: Variant;
  color?: Color;
  size?: Size;
  isLoading?: boolean;
  isDisabled?: boolean;
  isIconOnly?: boolean;
  fullWidth?: boolean;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  as?: React.ElementType;
  href?: string;
  target?: string;
  download?: boolean;
  onPress?: () => void;
}

/**
 * Higherskins Button — warm-editorial:
 *   primary  = terracotta filled  (main CTA — buy, subscribe, submit)
 *   secondary= pine outline       (secondary action — view, browse)
 *   ghost    = quiet inline       (tertiary — cancel, learn more)
 */
export function Button({
  variant = "primary",
  color,
  size = "md",
  isLoading = false,
  isDisabled = false,
  isIconOnly = false,
  fullWidth = false,
  startContent,
  endContent,
  as,
  href,
  target,
  download,
  onPress,
  children,
  className,
  onClick,
  type,
  ...rest
}: ButtonProps) {
  const resolved = resolveVariant(variant, color);

  const base =
    "inline-flex items-center justify-center gap-2 font-medium tracking-tight " +
    "transition-[background-color,border-color,color,transform,box-shadow] duration-200 " +
    "select-none whitespace-nowrap rounded-[var(--radius-md)] " +
    "disabled:cursor-not-allowed disabled:opacity-60 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]";

  const sizes: Record<Size, string> = {
    sm: isIconOnly ? "h-8 w-8 text-sm" : "h-8 px-3 text-[13px]",
    md: isIconOnly ? "h-10 w-10 text-sm" : "h-10 px-4 text-sm",
    lg: isIconOnly ? "h-12 w-12" : "h-12 px-6 text-[15px]",
  };

  const variants: Record<string, string> = {
    primary:
      "bg-[color:var(--color-accent)] text-white border border-transparent hover:bg-[color:var(--color-accent-hover)] active:translate-y-[1px]",
    secondary:
      "bg-transparent text-[color:var(--color-primary)] border border-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-tint)]",
    outline:
      "bg-transparent text-[color:var(--color-text)] border border-[color:var(--color-border)] hover:border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-bg-secondary)]",
    ghost:
      "bg-transparent text-[color:var(--color-text)] border border-transparent hover:bg-[color:var(--color-bg-secondary)]",
    tertiary:
      "bg-transparent text-[color:var(--color-text-secondary)] border border-transparent hover:text-[color:var(--color-text)]",
    danger:
      "bg-[color:var(--color-danger)] text-white border border-transparent hover:brightness-105 active:translate-y-[1px]",
    "danger-soft":
      "bg-[color:var(--color-danger-light)] text-[color:var(--color-danger)] border border-transparent hover:brightness-95",
  };

  const classes = twMerge(
    clsx(
      base,
      sizes[size],
      variants[resolved] ?? variants.primary,
      fullWidth && "w-full",
      className,
    ),
  );

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled || isLoading) return;
    onClick?.(e);
    onPress?.();
  };

  const content = (
    <>
      {isLoading && (
        <span
          aria-hidden
          className="inline-block h-[1em] w-[1em] animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {!isLoading && startContent}
      {!isIconOnly && children}
      {endContent}
    </>
  );

  if (as || href) {
    const Component: React.ElementType = as || "a";
    return (
      <Component
        href={href}
        target={target}
        download={download}
        className={classes}
        onClick={handleClick as unknown as React.MouseEventHandler}
        {...rest}
      >
        {content}
      </Component>
    );
  }

  return (
    <button
      type={type || "button"}
      className={classes}
      onClick={handleClick}
      disabled={isDisabled || isLoading}
      {...rest}
    >
      {content}
    </button>
  );
}

function resolveVariant(variant: Variant, color?: Color): string {
  if (color === "primary" && variant !== "outline" && variant !== "bordered" && variant !== "ghost" && variant !== "light" && variant !== "flat") return "primary";
  if (color === "danger" && (variant === "flat" || variant === "light")) return "danger-soft";
  if (color === "danger") return "danger";
  if (variant === "light" || variant === "flat") return "ghost";
  if (variant === "bordered") return "outline";
  return variant;
}
