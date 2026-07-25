import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ user: null });
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        hasPassword: Boolean(user.passwordHash),
        steam: user.steamAccount
          ? {
              personaName: user.steamAccount.personaName,
              avatar: user.steamAccount.avatar,
              avatarFull: user.steamAccount.avatarFull,
              profileUrl: user.steamAccount.profileUrl,
              tradeUrlVerified: user.steamAccount.tradeUrlVerified,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error getting user:", error);
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
}
