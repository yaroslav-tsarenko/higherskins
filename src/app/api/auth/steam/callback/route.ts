import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie, getSessionUser } from "@/lib/auth";
import { verifySteamCallback, fetchSteamProfile, getBaseUrl } from "@/lib/steam";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") || "en";
  const next = url.searchParams.get("next") || `/${locale}/account`;
  const isLink = url.searchParams.get("link") === "1";
  const base = getBaseUrl();
  const dest = next.startsWith("/") ? `${base}${next}` : `${base}/${locale}/account`;

  try {
    const steamId64 = await verifySteamCallback(url.searchParams);
    if (!steamId64) {
      return NextResponse.redirect(`${base}/${locale}/auth?error=steam`);
    }

    const profile = await fetchSteamProfile(steamId64);
    const steamData = {
      personaName: profile.personaName,
      profileUrl: profile.profileUrl,
      avatar: profile.avatar,
      avatarFull: profile.avatarFull,
    };

    const existing = await prisma.steamAccount.findUnique({
      where: { steamId64 },
      select: { userId: true },
    });

    // ── Linking mode: attach this SteamID to the already signed-in user. ──
    if (isLink) {
      const current = await getSessionUser();
      if (!current) {
        return NextResponse.redirect(`${base}/${locale}/auth?error=steam`);
      }
      if (existing && existing.userId !== current.id) {
        // This SteamID already belongs to another account.
        const sep = dest.includes("?") ? "&" : "?";
        return NextResponse.redirect(`${dest}${sep}steam=taken`);
      }
      if (existing) {
        // Already linked to this same user — just refresh the profile.
        await prisma.steamAccount.update({ where: { steamId64 }, data: steamData });
      } else {
        await prisma.steamAccount.create({
          data: { userId: current.id, steamId64, ...steamData },
        });
      }
      await prisma.user.update({
        where: { id: current.id },
        data: { avatarUrl: profile.avatar ?? undefined },
      });
      const sep = dest.includes("?") ? "&" : "?";
      return NextResponse.redirect(`${dest}${sep}steam=linked`);
    }

    // ── Sign-in mode: reuse the linked user, or create one on first login. ──
    let userId: string;
    if (existing) {
      userId = existing.userId;
      await prisma.steamAccount.update({ where: { steamId64 }, data: steamData });
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: profile.personaName ?? undefined,
          avatarUrl: profile.avatar ?? undefined,
        },
      });
    } else {
      const user = await prisma.user.create({
        data: {
          name: profile.personaName,
          avatarUrl: profile.avatar,
          steamAccount: { create: { steamId64, ...steamData } },
        },
        select: { id: true },
      });
      userId = user.id;
    }

    await setSessionCookie(userId);
    return NextResponse.redirect(dest);
  } catch {
    return NextResponse.redirect(`${base}/${locale}/auth?error=steam`);
  }
}
