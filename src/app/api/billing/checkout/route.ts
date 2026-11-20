import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBilling } from "@/lib/billing";
import { buildSubscriptionCheckoutParams, newCheckoutBlockReason, trialEndUnix } from "@/lib/checkoutSession";
import { PLANS, planById, type PlanInterval } from "@/lib/plans";
import { isStripeConfigured, stripe, stripeTestMode } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const SITE = process.env.EMAIL_SITE_URL || "https://www.backofthebox.xyz";

/**
 * Start a $5/month or $39/year (up to 5 kids) Stripe Checkout. Any free time the user still has (trial or
 * code) becomes the subscription's trial, so subscribing early never costs a
 * day — the first charge lands when the free time runs out.
 *
 * While that free time remains, Checkout does not collect a card
 * (payment_method_collection=if_required). If the trial ends with no card,
 * Stripe pauses the subscription. After free time is over, Checkout collects
 * a card immediately, same as before.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { interval?: string; plan?: string };
  const interval: PlanInterval = body.interval === "month" ? "month" : "year";
  const plan = planById(body.plan) ?? PLANS[0];
  const email = (await auth().catch(() => null))?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!isStripeConfigured()) return NextResponse.json({ error: "Payments aren't switched on yet." }, { status: 503 });

  const b = await getBilling(email);
  const blocked = newCheckoutBlockReason(b);
  if (blocked) return NextResponse.json({ error: blocked }, { status: 409 });

  const freeUntil = Math.max(Date.parse(b.trialEndsAt) || 0, Date.parse(b.compUntil ?? "") || 0);
  const trialEnd = trialEndUnix(freeUntil, Date.now());
  const priceId = process.env[`STRIPE_PRICE_ID_${plan.id.toUpperCase()}_${interval.toUpperCase()}`];
  try {
    const session = await stripe<{ url: string }>(
      "POST",
      "checkout/sessions",
      buildSubscriptionCheckoutParams({
        email,
        plan,
        interval,
        customerId: b.customerId,
        trialEnd,
        testMode: stripeTestMode,
        site: SITE,
        priceId,
      }),
    );
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Checkout failed" }, { status: 502 });
  }
}
