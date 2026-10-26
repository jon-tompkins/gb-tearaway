import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBilling, PRICE_CENTS } from "@/lib/billing";
import { ANNUAL_PLANS, planById } from "@/lib/plans";
import { stripe, stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const SITE = process.env.EMAIL_SITE_URL || "https://www.backofthebox.xyz";
/** Stripe won't take a trial_end less than 48h out. */
const MIN_TRIAL_MS = 49 * 3_600_000;

/**
 * Start a $5/month (or a yearly 1/2/5-kid plan) Stripe Checkout. Any free time the user still has (trial or
 * code) becomes the subscription's trial, so subscribing early never costs a
 * day — the first charge lands when the free time runs out.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { interval?: string; plan?: string };
  const annual = body.interval === "year";
  const plan = annual ? (planById(body.plan) ?? ANNUAL_PLANS[0]) : undefined;
  const email = (await auth().catch(() => null))?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!stripeConfigured) return NextResponse.json({ error: "Payments aren't switched on yet." }, { status: 503 });

  const b = await getBilling(email);
  const freeUntil = Math.max(Date.parse(b.trialEndsAt) || 0, Date.parse(b.compUntil ?? "") || 0);
  const trialEnd = freeUntil - Date.now() > 0 ? Math.max(freeUntil, Date.now() + MIN_TRIAL_MS) : null;

  const priceId = plan ? process.env[`STRIPE_PRICE_ID_${plan.id.toUpperCase()}`] : process.env.STRIPE_PRICE_ID;
  const price = priceId
    ? { price: priceId, quantity: 1 }
    : {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: plan ? plan.cents : PRICE_CENTS,
          recurring: { interval: annual ? "year" : "month" },
          product_data: { name: plan ? `Back of the Box, ${plan.label.toLowerCase()} (yearly)` : "Back of the Box" },
        },
      };
  try {
    const session = await stripe<{ url: string }>("POST", "checkout/sessions", {
      mode: "subscription",
      line_items: [price],
      ...(b.customerId ? { customer: b.customerId } : { customer_email: email }),
      client_reference_id: `user:${email}`,
      subscription_data: {
        metadata: { userKey: `user:${email}`, ...(plan ? { plan: plan.id, maxKids: String(plan.kids) } : {}) },
        ...(trialEnd ? { trial_end: Math.floor(trialEnd / 1000) } : {}),
      },
      allow_promotion_codes: true,
      success_url: `${SITE}/app/billing?status=success`,
      cancel_url: `${SITE}/app/billing?status=cancelled`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Checkout failed" }, { status: 502 });
  }
}
