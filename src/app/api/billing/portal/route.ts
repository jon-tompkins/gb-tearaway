import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBilling } from "@/lib/billing";
import { stripe, stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const SITE = process.env.EMAIL_SITE_URL || "https://www.backofthebox.xyz";

/** Stripe's hosted billing portal: update card, see invoices, cancel. */
export async function POST() {
  const email = (await auth().catch(() => null))?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!stripeConfigured) return NextResponse.json({ error: "Payments aren't switched on yet." }, { status: 503 });
  const b = await getBilling(email);
  if (!b.customerId) return NextResponse.json({ error: "No subscription yet." }, { status: 400 });
  try {
    const s = await stripe<{ url: string }>("POST", "billing_portal/sessions", {
      customer: b.customerId,
      return_url: `${SITE}/app/billing`,
    });
    return NextResponse.json({ url: s.url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Portal failed" }, { status: 502 });
  }
}
