"use client";

import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { MapPin } from "lucide-react";

export default function AddressesPage() {
  const t = useTranslations("account");

  return (
    <div>
      <h1 className="mb-5 font-serif text-2xl font-medium tracking-tight text-[color:var(--color-text)] sm:text-3xl">{t("addresses")}</h1>
      <EmptyState
        title="No addresses yet"
        subtitle="Add a shipping address for faster checkout"
        icon={<MapPin size={48} />}
      />
    </div>
  );
}
