import { NextResponse } from "next/server";
import { accessFor } from "@/lib/billing";
import { currentUserKey } from "@/lib/userKey";
import { stripeTestMode } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/** The signed-in user's plan: trial / paid / code / expired. */
export async function GET() {
  const userKey = await currentUserKey();
  return NextResponse.json({ signedIn: userKey !== "demo", access: await accessFor(userKey), testMode: stripeTestMode });
}
