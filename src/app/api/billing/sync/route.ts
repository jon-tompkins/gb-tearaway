import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { applyCheckoutSession, BillingOwnerError, refreshBillingFromStripe, resumePausedSubscription } from "@/lib/billingSync";

export const dynamic = "force-dynamic";

/**
 * Pull the latest Stripe state for the signed-in parent.
 * `sessionId` applies a finished Checkout (plan or card). `resume` charges a
 * saved card on a paused plan. A plain sync never charges.
 */
export async function POST(req: Request) {
  const email = (await auth().catch(() => null))?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { sessionId?: string; resume?: boolean };
  try {
    if (body.sessionId) await applyCheckoutSession(email, body.sessionId);
    if (body.resume) {
      const access = await resumePausedSubscription(email);
      return NextResponse.json({ access });
    }
  } catch (e) {
    if (e instanceof BillingOwnerError) return NextResponse.json({ error: e.message }, { status: 403 });
    const message = e instanceof Error ? e.message : "Billing update failed";
    if (body.sessionId || body.resume) return NextResponse.json({ error: message }, { status: 400 });
  }
  try {
    return NextResponse.json({ access: await refreshBillingFromStripe(email) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Billing update failed" }, { status: 502 });
  }
}
