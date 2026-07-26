"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileFormData } from "@/lib/validators/profile";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { Check, Link2, Lock, ShieldCheck } from "lucide-react";

const INPUT =
  "w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] px-3 py-2.5 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-tertiary)] focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20";

interface MeSteam {
  personaName: string | null;
  avatarFull: string | null;
  avatar: string | null;
  profileUrl: string | null;
  tradeUrlVerified: boolean;
}

export default function ProfilePage() {
  const t = useTranslations("account");
  const common = useTranslations("common");
  const { user, refresh } = useAuth();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [steam, setSteam] = useState<MeSteam | null>(null);
  const [hasPassword, setHasPassword] = useState(true);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const loadMe = () => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          reset({ name: data.user.name || "", phone: data.user.phone || "" });
          setSteam(data.user.steam ?? null);
          setHasPassword(Boolean(data.user.hasPassword));
        }
      });
  };

  useEffect(() => {
    if (user) loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const s = searchParams.get("steam");
    if (s === "linked") toast.success("Steam account linked.");
    else if (s === "taken") toast.error("That Steam account is already linked to another user.");
  }, [searchParams]);

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    try {
      await fetch("/api/auth/sync-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user?.id, email: user?.email, name: data.name }),
      });
      await refresh();
      toast.success(t("editProfile"));
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const steamLinkHref =
    `/api/auth/steam?link=1&next=${encodeURIComponent("/account/profile")}`;

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 font-serif text-2xl font-medium tracking-tight text-[color:var(--color-text)] sm:text-3xl">
        {t("editProfile")}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-[color:var(--color-text-secondary)]">Email</label>
          <input value={user?.email || ""} readOnly className={`${INPUT} opacity-60`} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[color:var(--color-text-secondary)]">Name</label>
          <input
            {...register("name")}
            className={`${INPUT} ${errors.name ? "!border-[color:var(--color-danger)]" : ""}`}
          />
          {errors.name && <p className="mt-1 text-xs text-[color:var(--color-danger)]">{errors.name.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[color:var(--color-text-secondary)]">Phone</label>
          <input {...register("phone")} className={INPUT} />
        </div>
        <Button type="submit" color="primary" isLoading={loading}>{common("save")}</Button>
      </form>

      {/* Linked accounts */}
      <section className="mt-10">
        <h2 className="mb-3 flex items-center gap-2 font-serif text-xl font-medium tracking-tight text-[color:var(--color-text)]">
          <Link2 size={18} className="text-[color:var(--color-primary)]" /> Linked accounts
        </h2>
        <div className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-5">
          {steam ? (
            <div className="flex items-center gap-3">
              <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[color:var(--color-primary-tint)]">
                {steam.avatarFull || steam.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={steam.avatarFull || steam.avatar || ""} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ShieldCheck size={18} className="text-[color:var(--color-primary)]" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-[color:var(--color-text)]">
                  {steam.personaName || "Steam account"}
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-[color:var(--color-success)]/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[color:var(--color-success)]">
                    <Check size={10} /> Linked
                  </span>
                </div>
                <div className="text-xs text-[color:var(--color-text-secondary)]">
                  {steam.tradeUrlVerified ? "Trade URL verified — ready to trade" : "Add your Trade URL to receive skins"}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-[color:var(--color-text)]">Steam not linked</div>
                <div className="text-xs text-[color:var(--color-text-secondary)]">
                  Link Steam to receive skins. Your HigherSkins account stays the same.
                </div>
              </div>
              <a
                href={steamLinkHref}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#171a21] px-4 text-sm font-bold text-white transition hover:brightness-125"
              >
                Link Steam
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Password */}
      <section className="mt-10">
        <h2 className="mb-3 flex items-center gap-2 font-serif text-xl font-medium tracking-tight text-[color:var(--color-text)]">
          <Lock size={18} className="text-[color:var(--color-primary)]" /> {hasPassword ? "Change password" : "Set a password"}
        </h2>
        <PasswordForm hasPassword={hasPassword} onDone={loadMe} />
      </section>
    </div>
  );
}

function PasswordForm({ hasPassword, onDone }: { hasPassword: boolean; onDone: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Could not update password.");
        return;
      }
      toast.success(hasPassword ? "Password changed." : "Password set.");
      setCurrent("");
      setNext("");
      setConfirm("");
      onDone();
    } catch {
      toast.error("Network error, please retry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-elevated)] p-5">
      {hasPassword && (
        <div>
          <label className="mb-1 block text-sm font-medium text-[color:var(--color-text-secondary)]">Current password</label>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required className={INPUT} />
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-[color:var(--color-text-secondary)]">New password</label>
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={6} className={INPUT} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[color:var(--color-text-secondary)]">Confirm new password</label>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} className={INPUT} />
      </div>
      <Button type="submit" color="primary" isLoading={saving}>{hasPassword ? "Change password" : "Set password"}</Button>
    </form>
  );
}
