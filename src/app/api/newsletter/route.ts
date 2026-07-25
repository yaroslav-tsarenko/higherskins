import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { generateUniqueNewsletterCode, NEWSLETTER_DISCOUNT_PERCENT } from "@/lib/discounts";

const schema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = schema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();

    const sessionUser = await getSessionUser();
    const userId = sessionUser?.id ?? null;

    const existing = await prisma.newsletter.findUnique({ where: { email: normalizedEmail } });

    if (existing) {
      const updates: { unsubscribedAt: Date | null; userId?: string } = { unsubscribedAt: null };
      if (userId && !existing.userId) updates.userId = userId;
      const refreshed = await prisma.newsletter.update({
        where: { email: normalizedEmail },
        data: updates,
      });

      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { newsletterSubscribed: true },
        }).catch(() => null);
      }

      return NextResponse.json({
        ok: true,
        alreadySubscribed: true,
        discountCode: refreshed.discountCode,
        discountPercent: NEWSLETTER_DISCOUNT_PERCENT,
        discountUsed: refreshed.discountUsed,
      });
    }

    const discountCode = await generateUniqueNewsletterCode();
    const created = await prisma.newsletter.create({
      data: {
        email: normalizedEmail,
        userId,
        discountCode,
      },
    });

    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { newsletterSubscribed: true },
      }).catch(() => null);
    }

    return NextResponse.json({
      ok: true,
      alreadySubscribed: false,
      discountCode: created.discountCode,
      discountPercent: NEWSLETTER_DISCOUNT_PERCENT,
      discountUsed: false,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
  }
}
