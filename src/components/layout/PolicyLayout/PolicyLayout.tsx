import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { ReactNode } from "react";
import { brand, brandAddressLine } from "@/lib/brand";

interface PolicyLayoutProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export function PolicyLayout({ title, lastUpdated, children }: PolicyLayoutProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 [overflow-wrap:anywhere] [word-break:break-word]">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Policies", href: "/policies" },
          { label: title },
        ]}
      />
      <span className="eyebrow">Policies</span>
      <h1 className="mb-5 mt-2 font-serif text-3xl font-medium tracking-tight text-[color:var(--color-text)] sm:text-[40px]">
        {title}
      </h1>
      <div
        className="prose-policy text-[15px] leading-[1.75] text-[color:var(--color-text-secondary)] max-sm:text-sm max-sm:leading-[1.65] [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-serif [&_h2]:font-medium [&_h2]:tracking-tight [&_h2]:text-[color:var(--color-text)] max-sm:[&_h2]:mt-6 max-sm:[&_h2]:text-base [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[color:var(--color-text)] max-sm:[&_h3]:text-[15px] [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:ml-6 [&_ul]:mt-2 [&_ul]:list-disc [&_ul>li]:mb-1 [&_table]:my-4 [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:text-sm [&_th]:border [&_th]:border-[color:var(--color-line)] [&_th]:bg-[color:var(--color-bg-secondary)] [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-[color:var(--color-text)] [&_th]:[word-break:break-word] [&_td]:border [&_td]:border-[color:var(--color-line)] [&_td]:px-3 [&_td]:py-2 [&_td]:text-left [&_td]:[word-break:break-word]"
      >
        <p className="mb-4 text-sm text-[color:var(--color-text-tertiary)]">Last updated: {lastUpdated}</p>
        {children}
      </div>
    </div>
  );
}

export function ContactBlock() {
  return (
    <div className="mt-2 rounded-md border border-[color:var(--color-line)] bg-[color:var(--color-bg-secondary)] px-4 py-3.5 text-sm leading-relaxed">
      <p>
        <strong>{brand.company.legalName}</strong>
        <br />
        Registration number: {brand.company.number}
        <br />
        Registered office: {brandAddressLine}
        <br />
        General email: {brand.contact.email}
      </p>
    </div>
  );
}
