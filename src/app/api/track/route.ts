import { NextResponse } from "next/server";
import { currentUserKey, DEMO_KEY } from "@/lib/userKey";
import { logEvent } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse/i;

/** Page-view beacon from <PageTracker/>. */
export async function POST(req: Request) {
  if (BOT.test(req.headers.get("user-agent") ?? "")) return new NextResponse(null, { status: 204 });
  let body: { path?: string; referrer?: string; visitor?: string } = {};
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  const path = typeof body.path === "string" ? body.path.slice(0, 200) : null;
  if (!path) return new NextResponse(null, { status: 204 });
  const userKey = await currentUserKey();
  let referrer: string | null = null;
  try {
    // Keep only the referring site, and drop our own domain.
    const host = body.referrer ? new URL(body.referrer).hostname.replace(/^www\./, "") : "";
    referrer = host && !host.endsWith("backofthebox.xyz") ? host : null;
  } catch {
    referrer = null;
  }
  await logEvent({
    type: "pageview",
    path,
    visitor: typeof body.visitor === "string" ? body.visitor.slice(0, 40) : null,
    user_key: userKey === DEMO_KEY ? null : userKey,
    referrer,
  });
  return new NextResponse(null, { status: 204 });
}
