import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBilling } from "@/lib/billing";
import { PLANS, centsFor, planById, type PlanInterval } from "@/lib/plans";
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
  const interval: PlanInterval = body.interval === "year" ? "year" : "quarter";
  const plan = planById(body.plan) ?? PLANS[0];
  const email = (await auth().catch(() => null))?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!stripeConfigured) return NextResponse.json({ error: "Payments aren't switched on yet." }, { status: 503 });

  const b = await getBilling(email);
  const freeUntil = Math.max(Date.parse(b.trialEndsAt) || 0, Date.parse(b.compUntil ?? "") || 0);
  const trialEnd = freeUntil - Date.now() > 0 ? Math.max(freeUntil, Date.now() + MIN_TRIAL_MS) : null;

  // Optional pre-made Stripe prices: STRIPE_PRICE_ID_KIDS2_YEAR, _KIDS2_QUARTER, _KIDS5_YEAR, _KIDS5_QUARTER.
  const priceId = process.env[`STRIPE_PRICE_ID_${plan.id.toUpperCase()}_${interval.toUpperCase()}`];
  const price = priceId
    ? { price: priceId, quantity: 1 }
    : {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: centsFor(plan, interval),
          recurring: interval === "year" ? { interval: "year" } : { interval: "month", interval_count: 3 },
          product_data: { name: `Back of the Box, ${plan.label.toLowerCase()} (${interval === "year" ? "yearly" : "quarterly"})` },
        },
      };
  try {
    const session = await stripe<{ url: string }>("POST", "checkout/sessions", {
      mode: "subscription",
      line_items: [price],
      ...(b.customerId ? { customer: b.customerId } : { customer_email: email }),
      client_reference_id: `user:${email}`,
      subscription_data: {
        metadata: { userKey: `user:${email}`, plan: plan.id, maxKids: String(plan.kids) },
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
