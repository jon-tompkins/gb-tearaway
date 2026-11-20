import { NextResponse } from "next/server";
import { freeEditionsEnabled, requestOrigin } from "@/lib/free/flag";
import { switchFreeEdition } from "@/lib/free/flow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!freeEditionsEnabled()) return NextResponse.json({ error: "not found" }, { status: 404 });
  const form = await req.formData();
  const token = String(form.get("token") ?? "");
  const editionId = String(form.get("editionId") ?? "");
  const result = await switchFreeEdition(token, editionId);
  const status = result === "ok" ? "updated" : "invalid";
  return NextResponse.redirect(new URL(`/free/switch?status=${status}`, requestOrigin(req)), 303);
}
