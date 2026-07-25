export function ProductSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 xl:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)]"
        >
          <div className="aspect-square animate-pulse bg-[color:var(--color-bg-secondary)]" />
          <div className="flex flex-col gap-3 p-5">
            <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-[color:var(--color-bg-secondary)]" />
            <div className="h-3 w-full animate-pulse rounded-full bg-[color:var(--color-bg-secondary)]" />
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-[color:var(--color-bg-secondary)]" />
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="h-5 w-16 animate-pulse rounded-full bg-[color:var(--color-bg-secondary)]" />
              <div className="h-10 w-10 animate-pulse rounded-full bg-[color:var(--color-bg-secondary)]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
