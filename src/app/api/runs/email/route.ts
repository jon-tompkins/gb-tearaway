import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { currentUserKey, DEMO_KEY } from "@/lib/userKey";
import { readStore } from "@/lib/store";
import { createRun, loadRunByToken, markRunEmailed } from "@/lib/runs";
import { emailRun } from "@/lib/sendDispatch";
import { claimPayload } from "@/lib/persist";
import { logEvent } from "@/lib/events";
import { dateISOInZone } from "@/lib/dates";
import { saveDispatchRef } from "@/lib/deliver";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * POST /api/runs/email { token } or { kidId } (today) — email a run to the
 * dispatch's send-to address (or the account email). Owner only; at most one
 * re-send per run per minute.
 */
export async function POST(req: Request) {
  const userKey = await currentUserKey();
  if (userKey === DEMO_KEY) return NextResponse.json({ error: "Sign in to email a page" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { token?: string; kidId?: string };
  const store = await readStore(userKey);

  let token = body.token;
  if (!token && body.kidId) {
    const kid = store.kids.find((k) => k.id === body.kidId);
    if (!kid) return NextResponse.json({ error: "Unknown page" }, { status: 404 });
    const date = dateISOInZone(kid.timezone || store.settings.timezone);
    token = await saveDispatchRef({ userKey, kidId: kid.id, date });
  }
  if (!token) return NextResponse.json({ error: "token or kidId required" }, { status: 400 });

  const found = await loadRunByToken(token);
  if (!found || found.ref.userKey !== userKey) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const kid = store.kids.find((k) => k.id === found.ref.kidId);
  if (!kid) return NextResponse.json({ error: "Unknown page" }, { status: 404 });

  const session = await auth().catch(() => null);
  const to = kid.deliveryEmail || session?.user?.email;
  if (!to) return NextResponse.json({ error: "No email address on file" }, { status: 400 });

  const minute = new Date().toISOString().slice(0, 16);
  if (!(await claimPayload(`runmail:${token}:${minute}`, { at: new Date().toISOString() }))) {
    return NextResponse.json({ error: "Just sent — try again in a minute" }, { status: 429 });
  }

  // No saved run yet (e.g. today before delivery time): save one now.
  if (!found.run) await createRun({ ...found.ref, kidName: kid.name, delivery: kid.deliveryMethod === "app" ? "app" : "email" });

  const sent = await emailRun({ token, kidName: kid.name, date: found.ref.date, to });
  if (!sent.ok) return NextResponse.json({ error: "Email failed to send" }, { status: 502 });
  await markRunEmailed(found.ref, to, sent.withPdf);
  await logEvent({ type: "email_sent", user_key: userKey, meta: { kidId: kid.id, kidName: kid.name, withPdf: sent.withPdf, date: found.ref.date, resend: true } });
  return NextResponse.json({ ok: true, to, withPdf: sent.withPdf });
}
