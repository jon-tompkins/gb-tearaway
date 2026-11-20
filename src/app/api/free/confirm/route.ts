import { NextResponse } from "next/server";
import { freeEditionsEnabled, requestOrigin } from "@/lib/free/flag";
import { clientIp, confirmFreeSignup } from "@/lib/free/flow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!freeEditionsEnabled()) return NextResponse.json({ error: "not found" }, { status: 404 });
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const result = await confirmFreeSignup(token, clientIp(req));
  const path = result === "ok" ? "/free/confirmed" : "/free/confirmed?status=expired";
  return NextResponse.redirect(new URL(path, requestOrigin(req)));
}
