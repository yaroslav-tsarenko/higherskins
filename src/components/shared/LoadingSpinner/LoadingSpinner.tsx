"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

/** Editorial loading indicator — hairline ring in ink color. */
export function LoadingSpinner({ size = "md", label, className }: LoadingSpinnerProps) {
  const dims = size === "sm" ? "h-4 w-4 border-2" : size === "lg" ? "h-8 w-8 border-[3px]" : "h-6 w-6 border-2";

  return (
    <div className={`flex items-center justify-center gap-3 p-8 ${className ?? ""}`}>
      <span
        aria-hidden
        className={`${dims} inline-block animate-spin rounded-full border-[color:var(--color-primary)]/25 border-t-[color:var(--color-primary)]`}
      />
      {label && (
        <span className="text-sm text-[color:var(--color-text-secondary)]">{label}</span>
      )}
    </div>
  );
}
