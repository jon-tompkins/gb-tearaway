import { NextResponse } from "next/server";
import { accessFor } from "@/lib/billing";
import { currentUserKey } from "@/lib/userKey";
import { renderPdfFromUrl } from "@/lib/pdf";
import { BOOKLET_LIMITS, buildBookletHtml, type BookletKind, type BookletLayout } from "@/lib/booklet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const KINDS: BookletKind[] = ["maze", "wordfind", "colorbynumber", "mix"];

const num = (v: string | null, d: number, lo: number, hi: number) => {
  const n = Number(v);
  return Number.isFinite(n) && v !== null && v !== "" ? Math.max(lo, Math.min(hi, Math.round(n))) : d;
};

/**
 * GET /api/booklet — a no-header, binder-ready puzzle booklet.
 * ?kind=maze|wordfind|colorbynumber|mix &layout=full|half &pages=25 &d=1..20
 * &seed=… &binder=1 &duplex=1 &answers=1 &format=html|print|pdf
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams;
  const access = await accessFor(await currentUserKey());
  if (!access.active) return NextResponse.json({ error: "Plan required" }, { status: 402 });

  const kindRaw = q.get("kind") as BookletKind | null;
  const kind: BookletKind = kindRaw && KINDS.includes(kindRaw) ? kindRaw : "mix";
  const layout: BookletLayout = q.get("layout") === "half" ? "half" : "full";
  const opts = {
    kind,
    layout,
    pages: num(q.get("pages"), 25, BOOKLET_LIMITS.minPages, BOOKLET_LIMITS.maxPages),
    difficulty: num(q.get("d"), 6, 1, 20),
    seed: num(q.get("seed"), 12345, 0, 2 ** 31 - 1),
    binder: q.get("binder") !== "0",
    duplex: q.get("duplex") !== "0",
    answers: q.get("answers") !== "0",
  };
  const format = q.get("format") ?? "html";

  if (format === "pdf") {
    // Render our own HTML view in headless Chromium so the PDF matches the preview.
    const self = new URL(req.url);
    self.searchParams.set("format", "html");
    const target = `${self.origin}${self.pathname}${self.search}`;
    const pdf = await renderPdfFromUrl(target);
    if (!pdf) {
      self.searchParams.set("format", "print");
      return NextResponse.redirect(new URL(self.pathname + self.search, req.url));
    }
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="back-of-the-box-booklet-${kind}-${opts.pages}p.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse(buildBookletHtml(opts, { autoPrint: format === "print" }), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
