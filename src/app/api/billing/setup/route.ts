import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBilling } from "@/lib/billing";
import { isStripeConfigured, stripe, stripeTestMode } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const SITE = process.env.EMAIL_SITE_URL || "https://www.backofthebox.xyz";

/** Collect a card for an existing customer and attach it. Does not start a second subscription. */
export async function POST() {
  const email = (await auth().catch(() => null))?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!isStripeConfigured()) return NextResponse.json({ error: "Payments aren't switched on yet." }, { status: 503 });
  const b = await getBilling(email);
  if (!b.customerId) return NextResponse.json({ error: "Pick a plan first. We'll ask for a card after that." }, { status: 400 });
  try {
    const session = await stripe<{ url: string }>("POST", "checkout/sessions", {
      mode: "setup",
      customer: b.customerId,
      currency: "usd",
      client_reference_id: `user:${email}`,
      metadata: { userKey: `user:${email}` },
      success_url: `${SITE}/app/billing?status=card&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE}/app/billing?status=cancelled`,
      ...(stripeTestMode
        ? {
            custom_text: {
              submit: {
                message:
                  "TEST MODE: Use the fake card 4242 4242 4242 4242, any future expiry, any CVC and ZIP. Nothing is charged today.",
              },
            },
          }
        : {}),
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Couldn't open card setup" }, { status: 502 });
  }
}
