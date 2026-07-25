# higherskins

**HigherSkins** — a modern CS2 skins marketplace. Browse thousands of skins with
live float, pattern and cross-market price data, track price history, and trade
instantly via Steam. UK-based, operated by **RYE FLOUR COOKIES LTD**.

## Stack

- Next.js 16 (App Router) · React 19
- TypeScript · Tailwind CSS v4 (CSS-first config)
- Prisma · Neon Postgres
- next-intl (i18n)
- Framer Motion, lucide-react, recharts, tailwind-merge

## Development

```bash
npm install
npm run dev            # starts on http://localhost:3000
npm run build          # prisma generate + next build
npm run lint
```

## Design system

All colours, spacing, radii, and typography live as design tokens in
`src/styles/variables.css` and are exposed to Tailwind through the `@theme`
block in `src/styles/globals.css`. Do not hardcode hex values in components —
reach for the tokens (`--color-primary`, `--color-accent`, `--color-border`,
`font-display`, `font-mono`, ...).

The aesthetic is **gaming-premium**: a deep near-black canvas, violet primary
(`#7C3AED`) with a cyan accent (`#22D3EE`), CS2 rarity colours for item tiers
and a Factory-New→Battle-Scarred wear gradient used across floats and the logo.

## Brand

Brand identity (name, domain, company details, contacts, socials) is centralised
in `src/lib/brand.ts` — import from there instead of hardcoding.

## Company

- **RYE FLOUR COOKIES LTD** (Company No. 15107933)
- 304d, The Big Peg, 120 Vyse St, Birmingham, England, B18 6ND, United Kingdom
- Phone: +44 7450 581147
- Email: info@higherskins.com
