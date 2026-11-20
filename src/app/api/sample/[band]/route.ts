import { NextResponse } from "next/server";
import { buildJobForKid } from "@/lib/serverStrip";
import { buildPrintHtml } from "@/lib/printHtml";
import { renderPdfFromUrl } from "@/lib/pdf";
import { seedKid, DEMO_KEY } from "@/lib/store";
import { templateSlots, type StartTemplate } from "@/lib/templates";
import { sampleWorldNews } from "@/lib/content/sampleNews";
import { AGE_BANDS, type AgeBand } from "@/lib/types";

/**
 * Public sample layout: the landing page promises kid-safe news, a maze, a
 * crossword, and a joke. Biggest cards first so both Letter columns fill.
 */
const SAMPLE_TEMPLATE: StartTemplate = {
  id: "public-sample",
  name: "Public sample",
  emoji: "📰",
  blurb: "News, a crossword, a maze, and a joke",
  cards: [["crossword"], ["maze"], ["news_world"], ["joke"], ["weather"], ["word"], ["fact"]],
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Public, no-sign-in sample page: GET /api/sample/7-9 → a printable PDF of today's page
 * for that age band (news, a maze, a crossword, and a joke). ?format=print returns the print HTML
 * (also what the PDF renderer loads). Edge-cached so shares don't re-render each time.
 */
export async function GET(req: Request, { params }: { params: Promise<{ band: string }> }) {
  const { band } = await params;
  if (!AGE_BANDS.some((b) => b.id === band)) {
    return NextResponse.json({ error: "Unknown age band" }, { status: 404 });
  }
  const url = new URL(req.url);
  const ageBand = band as AgeBand;
  const kid = seedKid({
    id: `sample-${band}`,
    name: "Sample",
    ageBand,
    paperSize: "letter",
    slots: templateSlots(SAMPLE_TEMPLATE, "letter"),
  });
  const job = await buildJobForKid(kid, {
    userKey: DEMO_KEY,
    nonce: 0,
    // Live news wins when the morning feed is ready. Otherwise print a gentle static story.
    sampleNews: { news_world: sampleWorldNews(ageBand) },
  });

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
