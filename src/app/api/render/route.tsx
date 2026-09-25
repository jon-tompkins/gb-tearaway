import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { StripOg } from "@/components/StripOg";
import { buildJobForKid, estimateJobHeight } from "@/lib/serverStrip";
import { buildPrintHtml } from "@/lib/printHtml";
import { readStore } from "@/lib/store";
import { currentUserKey } from "@/lib/userKey";
import { savePayload } from "@/lib/persist";
import { answersToken, collectAnswers } from "@/lib/answers";
import { qrSvg } from "@/lib/qr";
import { loadDispatchRef } from "@/lib/deliver";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Firmware / printer bridge contract:
 *   GET /api/render?kid=<id>&format=html|png|json&date=YYYY-MM-DD
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  let kidId = url.searchParams.get("kid") ?? url.searchParams.get("kidId");
  let date = url.searchParams.get("date") ?? undefined;
  const format = (url.searchParams.get("format") ?? "html").toLowerCase();

  // Public delivery token (from the daily email) — resolves the dispatch without
  // needing the recipient's session.
  const token = url.searchParams.get("token");
  let tokenUserKey: string | null = null;
  if (token) {
    const ref = await loadDispatchRef(token);
    if (!ref) {
      return NextResponse.json({ error: "This dispatch link has expired." }, { status: 404 });
    }
    tokenUserKey = ref.userKey;
    kidId = ref.kidId;
    date = date ?? ref.date;
  }

  if (!kidId) {
    return NextResponse.json(
      {
        error: "Missing kid query param",
        contract: {
          url: "/api/render",
          query: {
            kid: "kid profile id (required), e.g. demo-sam",
            date: "YYYY-MM-DD (optional; defaults to today in the kid timezone)",
            format: "html | print | png | json (default html)",
            auto: "1 to auto-open the print dialog (print format only)",
          },
          related: {
            latest: "GET /api/print-jobs/latest — last queued job for the active kid",
            preview: "GET /api/print-jobs/preview — generate without persisting",
            stripPage: "GET /strip/<kidId> — HTML strip as a page",
          },
        },
      },
      { status: 400 },
    );
  }

  if (typeof date === "string" && date.length && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }

  const userKey = tokenUserKey ?? (await currentUserKey());
  const store = await readStore(userKey);
  const kid = store.kids.find((k) => k.id === kidId);
  if (!kid) {
    return NextResponse.json({ error: "Unknown kid id" }, { status: 404 });
  }

  const job = await buildJobForKid(kid, { dateISO: date, userKey });

  if (format === "json") {
    // Drop bulky HTML for JSON consumers; keep sections + meta
    const { previewHtml: _html, ...rest } = job;
    return NextResponse.json(rest);
  }

  if (format === "print" || format === "pdf") {
    const autoPrint = url.searchParams.get("auto") === "1";
    const embed = url.searchParams.get("embed") === "1";
    // Persist this dispatch's answer keys under a stable token and render a QR
    // to the public answers page (the scanning phone need not be signed in).
    // Done for embed too so the on-screen preview matches print exactly.
    let qr: string | undefined;
    const items = collectAnswers(job);
    if (items.length) {
      const token = answersToken(kid.id, job.date, job.nonce);
      await savePayload(`answers:${token}`, {
        kidName: job.kidName,
        date: job.date,
        items,
        generatedAt: new Date().toISOString(),
      });
      const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
      const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
      qr = qrSvg(`${proto}://${host}/answers/${token}`, { sizePx: 96 });
    }
    const html = buildPrintHtml(job, { autoPrint, qrSvg: qr, embed });
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  if (format === "png") {
    const fontRegular = await readFile(
      path.join(process.cwd(), "src/fonts/IBMPlexMono-Regular.ttf"),
    );
    const fontBold = await readFile(
      path.join(process.cwd(), "src/fonts/IBMPlexMono-Bold.ttf"),
    );
    const height = estimateJobHeight(job);
    return new ImageResponse(<StripOg job={job} />, {
      width: 384,
      height,
      fonts: [
        { name: "IBM Plex Mono", data: fontRegular, weight: 400, style: "normal" },
        { name: "IBM Plex Mono", data: fontBold, weight: 700, style: "normal" },
      ],
      headers: {
        "Content-Disposition": `inline; filename="back-of-the-box-${kid.id}-${job.date}.png"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse(job.previewHtml, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
