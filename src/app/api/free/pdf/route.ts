import { NextResponse } from "next/server";
import { freeEditionsEnabled } from "@/lib/free/flag";
import { subscriberFromOpenToken } from "@/lib/free/flow";
import { loadEditionPdf } from "@/lib/free/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!freeEditionsEnabled()) return NextResponse.json({ error: "not found" }, { status: 404 });
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const opened = await subscriberFromOpenToken(token);
  if (!opened) return NextResponse.json({ error: "not found" }, { status: 404 });
  const pdf = await loadEditionPdf(opened.editionId, opened.date);
  if (!pdf) return NextResponse.json({ error: "not found" }, { status: 404 });
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="back-of-the-box-${opened.editionId}-${opened.date}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
