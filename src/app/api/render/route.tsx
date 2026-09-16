import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { StripOg } from "@/components/StripOg";
import { buildJobForKid, estimateJobHeight } from "@/lib/serverStrip";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Firmware / printer bridge contract:
 *   GET /api/render?kid=<id>&format=html|png|json&date=YYYY-MM-DD
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const kidId = url.searchParams.get("kid") ?? url.searchParams.get("kidId");
  const date = url.searchParams.get("date") ?? undefined;
  const format = (url.searchParams.get("format") ?? "html").toLowerCase();

  if (!kidId) {
    return NextResponse.json(
      {
        error: "Missing kid query param",
        contract: {
          url: "/api/render",
          query: {
            kid: "kid profile id (required), e.g. demo-sam",
            date: "YYYY-MM-DD (optional; defaults to today in the kid timezone)",
            format: "html | png | json (default html)",
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

  const store = await readStore();
  const kid = store.kids.find((k) => k.id === kidId);
  if (!kid) {
    return NextResponse.json({ error: "Unknown kid id" }, { status: 404 });
  }

  const job = await buildJobForKid(kid, { dateISO: date });

  if (format === "json") {
    // Drop bulky HTML for JSON consumers; keep sections + meta
    const { previewHtml: _html, ...rest } = job;
    return NextResponse.json(rest);
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
        "Content-Disposition": `inline; filename="tearaway-${kid.id}-${job.date}.png"`,
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
