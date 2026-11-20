import { NextResponse } from "next/server";
import { requestOrigin } from "@/lib/free/flag";
import { freeRuntime } from "@/lib/free/runtime";
import { clientIp, confirmFreeSignup } from "@/lib/free/flow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await freeRuntime()).active) return NextResponse.json({ error: "not found" }, { status: 404 });
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const result = await confirmFreeSignup(token, clientIp(req));
  const path = result.status === "ok" ? `/free/confirmed?edition=${encodeURIComponent(result.editionId)}` : "/free/confirmed?status=expired";
  return NextResponse.redirect(new URL(path, requestOrigin(req)));
}
