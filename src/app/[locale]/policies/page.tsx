import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { Link } from "@/i18n/routing";

export const metadata = { title: "Policies — Higherskins" };

const policies = [
  { label: "Terms and Conditions", href: "/policies/terms" },
  { label: "Trade Delivery Policy", href: "/policies/shipping" },
  { label: "Privacy Policy", href: "/policies/privacy" },
  { label: "Cookie Policy", href: "/policies/cookies" },
  { label: "Refunds and Cancellation Policy", href: "/policies/returns" },
  { label: "Payment Policy", href: "/policies/payment" },
];

export default function PoliciesIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Policies" }]} />
      <span className="eyebrow">Legal</span>
      <h1 className="mb-4 mt-2 font-serif text-3xl font-medium tracking-tight text-[color:var(--color-text)] sm:text-[40px]">
        Policies
      </h1>
      <p className="mb-6 text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
        Please review our policies below. These policies govern your use of the Higherskins website and
        any purchases made through it.
      </p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {policies.map((policy) => (
          <li key={policy.href}>
            <Link
              href={policy.href}
              className="block rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] px-4 py-3.5 text-[15px] font-semibold text-[color:var(--color-text)] transition-colors hover:border-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-tint)]"
            >
              {policy.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
