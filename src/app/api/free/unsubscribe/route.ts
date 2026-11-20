import { NextResponse } from "next/server";
import { freeEditionsEnabled, requestOrigin } from "@/lib/free/flag";
import { unsubscribeFree } from "@/lib/free/flow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function tokenFrom(req: Request): Promise<{ token: string; oneClick: boolean; browserForm: boolean }> {
  const urlToken = new URL(req.url).searchParams.get("token") ?? "";
  const contentType = req.headers.get("content-type") ?? "";
  const browserForm = contentType.includes("application/x-www-form-urlencoded");
  if (!browserForm) return { token: urlToken, oneClick: false, browserForm: false };
  const params = new URLSearchParams(await req.text());
  const oneClick = params.get("List-Unsubscribe") === "One-Click";
  return { token: urlToken || params.get("token") || "", oneClick, browserForm: true };
}

/** Mail clients that GET the List-Unsubscribe URL land on the confirm page. */
export async function GET(req: Request) {
  if (!freeEditionsEnabled()) return NextResponse.json({ error: "not found" }, { status: 404 });
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const dest = token ? `/free/unsubscribe?token=${encodeURIComponent(token)}` : "/free/unsubscribe";
  return NextResponse.redirect(new URL(dest, requestOrigin(req)));
}

/** One-click POST (RFC 8058) and the button on /free/unsubscribe. */
export async function POST(req: Request) {
  if (!freeEditionsEnabled()) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { token, oneClick, browserForm } = await tokenFrom(req);
  const result = await unsubscribeFree(token);
  if (browserForm && !oneClick) {
    const path = result === "ok" ? "/free/unsubscribed" : "/free/unsubscribed?status=expired";
    return NextResponse.redirect(new URL(path, requestOrigin(req)), 303);
  }
  if (result !== "ok") return NextResponse.json({ error: "invalid" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
