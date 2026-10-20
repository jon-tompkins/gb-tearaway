import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cronAuth";
import { sendOneDispatch } from "@/lib/sendDispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// One email: PDF render (~5-20s) + send. Its own invocation, its own budget.
export const maxDuration = 120;

/** Send a single kid's dispatch. Called by the /api/cron/send dispatcher. */
export async function POST(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as {
    userKey?: string;
    kidId?: string;
    force?: boolean;
    noEmail?: boolean;
  };
  if (!body.userKey || !body.kidId) return NextResponse.json({ error: "userKey and kidId required" }, { status: 400 });
  const result = await sendOneDispatch({ userKey: body.userKey, kidId: body.kidId }, { force: !!body.force, noEmail: !!body.noEmail });
  return NextResponse.json(result);
}
