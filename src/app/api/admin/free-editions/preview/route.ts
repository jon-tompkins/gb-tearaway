import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { adminDenied } from "@/lib/free/adminOps";
import { dateISOInZone } from "@/lib/dates";
import { loadFreeAdmin } from "@/lib/free/runtime";
import { buildFreeEditionJob, freeEditionHtml } from "@/lib/free/render";
import { renderPdfFromHtml } from "@/lib/pdf";
import { answersToken, collectAnswers } from "@/lib/answers";
import { qrSvg } from "@/lib/qr";
import { siteOrigin } from "@/lib/free/flag";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

/** Render today's PDF for one edition. Nothing is cached or emailed. */
export async function GET(req: Request) {
  if (adminDenied(await isAdmin())) return NextResponse.json({ error: "not found" }, { status: 404 });
  const id = new URL(req.url).searchParams.get("edition") ?? "";
  const settings = await loadFreeAdmin();
  const edition = settings.editions.find((e) => e.id === id && !e.archived);
  if (!edition) return NextResponse.json({ error: "Unknown edition." }, { status: 404 });
  const date = dateISOInZone(edition.timezone);
  const job = await buildFreeEditionJob(edition, date);
  const answers = collectAnswers(job);
  const qr = answers.length ? qrSvg(`${siteOrigin()}/answers/${answersToken(job.kidId, date, job.nonce)}`, { sizePx: 96 }) : undefined;
  const pdf = await renderPdfFromHtml(freeEditionHtml(job, edition, qr, siteOrigin(), settings.upgradeText));
  if (!pdf) return NextResponse.json({ error: "The preview did not render." }, { status: 500 });
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="preview-${edition.id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
