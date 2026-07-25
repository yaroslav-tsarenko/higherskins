import { NextRequest, NextResponse } from "next/server";
import { contactSchema } from "@/lib/validators/contact";
import { sendContactFormEmail, sendContactAutoReplyEmail } from "@/lib/email";
import { scheduleEmail } from "@/lib/email-jobs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = contactSchema.parse(body);

    scheduleEmail("contact notification", () => sendContactFormEmail(validated));
    scheduleEmail("contact auto-reply", () => sendContactAutoReplyEmail(validated));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending contact form:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
