import { NextResponse } from "next/server";
import { buildPrintHtml } from "@/lib/printHtml";
import { renderPdfFromUrl } from "@/lib/pdf";
import { buildSampleJob } from "@/lib/samplePage";
import { AGE_BANDS, type AgeBand } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Public, no-sign-in sample page: GET /api/sample/7-9 → a printable PDF of today's page
 * for that age band (puzzles, world news, and a joke). ?format=print returns the print HTML
 * (also what the PDF renderer loads). Edge-cached so shares don't re-render each time.
 * When live news isn't available, the page uses the static sample-news bank.
 */
export async function GET(req: Request, { params }: { params: Promise<{ band: string }> }) {
  const { band } = await params;
  if (!AGE_BANDS.some((b) => b.id === band)) {
    return NextResponse.json({ error: "Unknown age band" }, { status: 404 });
  }
  const url = new URL(req.url);
  const job = await buildSampleJob(band as AgeBand);

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
