import { NextResponse } from "next/server";
import { buildJobForKid } from "@/lib/serverStrip";
import { buildPrintHtml } from "@/lib/printHtml";
import { renderPdfFromUrl } from "@/lib/pdf";
import { seedKid, DEMO_KEY } from "@/lib/store";
import { START_TEMPLATES, templateSlots } from "@/lib/templates";
import { AGE_BANDS, type AgeBand } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Public, no-sign-in sample page: GET /api/sample/7-9 → a printable PDF of today's page
 * for that age band (a generic "Puzzle Whiz" layout). ?format=print returns the print HTML
 * (also what the PDF renderer loads). Edge-cached so shares don't re-render each time.
 */
export async function GET(req: Request, { params }: { params: Promise<{ band: string }> }) {
  const { band } = await params;
  if (!AGE_BANDS.some((b) => b.id === band)) {
    return NextResponse.json({ error: "Unknown age band" }, { status: 404 });
  }
  const url = new URL(req.url);
  const tpl = START_TEMPLATES.find((t) => t.id === "puzzle") ?? START_TEMPLATES[0];
  const kid = seedKid({
    id: `sample-${band}`,
    name: "Sample",
    ageBand: band as AgeBand,
    paperSize: "letter",
    slots: templateSlots(tpl, "letter"),
  });
  const job = await buildJobForKid(kid, { userKey: DEMO_KEY, nonce: 0 });

  if (url.searchParams.get("format") === "print") {
    return new NextResponse(buildPrintHtml(job, {}), {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, s-maxage=3600" },
    });
  }

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
  const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const pdf = await renderPdfFromUrl(`${proto}://${host}/api/sample/${band}?format=print`);
  if (!pdf) return NextResponse.redirect(`${proto}://${host}/api/sample/${band}?format=print`, 302);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="back-of-the-box-sample-${band}.pdf"`,
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
