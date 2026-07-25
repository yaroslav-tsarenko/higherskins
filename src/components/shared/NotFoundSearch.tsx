"use client";

import { useState } from "react";
import { Search } from "lucide-react";

export function NotFoundSearch() {
  const [query, setQuery] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    window.location.href = q
      ? `/en/search?q=${encodeURIComponent(q)}`
      : "/en/search";
  };

  return (
    <form onSubmit={submit} className="mt-2 w-full max-w-md">
      <div className="relative">
        <Search
          size={17}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-text-tertiary)]"
        />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skins — e.g. AK-47 Redline"
          className="w-full rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] py-3.5 pl-11 pr-28 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-tertiary)] focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-[color:var(--color-primary)] px-4 py-2 text-xs font-bold text-[color:var(--color-primary-fg)] transition-colors hover:bg-[color:var(--color-primary-hover)]"
        >
          Search
        </button>
      </div>
    </form>
  );
}
