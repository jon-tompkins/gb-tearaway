import { NextResponse } from "next/server";
import { logEvent } from "@/lib/events";
import { requestOrigin } from "@/lib/free/flag";
import { freeRuntime } from "@/lib/free/runtime";
import { subscriberFromOpenToken } from "@/lib/free/flow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Click redirect for the daily email. Logs free_pdf_clicked, then serves the PDF. */
export async function GET(req: Request) {
  if (!(await freeRuntime()).active) return NextResponse.json({ error: "not found" }, { status: 404 });
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const opened = await subscriberFromOpenToken(token);
  if (!opened) return NextResponse.json({ error: "not found" }, { status: 404 });
  await logEvent({
    type: "free_pdf_clicked",
    meta: { subscriberId: opened.sub.id, editionId: opened.editionId, date: opened.date },
  });
  const dest = new URL("/api/free/pdf", requestOrigin(req));
  dest.searchParams.set("token", token);
  return NextResponse.redirect(dest);
}
