import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { redeemCode } from "@/lib/billing";

export const dynamic = "force-dynamic";

/** Redeem an access code. Body: { code }. */
export async function POST(req: Request) {
  const email = (await auth().catch(() => null))?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { code } = (await req.json().catch(() => ({}))) as { code?: string };
  if (!code?.trim()) return NextResponse.json({ error: "Enter a code." }, { status: 400 });
  const r = await redeemCode(email, code);
  return r.ok ? NextResponse.json({ access: r.access }) : NextResponse.json({ error: r.error }, { status: 400 });
}
