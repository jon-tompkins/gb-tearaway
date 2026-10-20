import { NextResponse } from "next/server";
import { loadRunByToken, runUrls } from "@/lib/runs";
import { renderPdfFromUrl } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET /api/runs/pdf?token=… — the saved run as a PDF download. */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });
  const found = await loadRunByToken(token);
  if (!found) return NextResponse.json({ error: "Unknown or expired link" }, { status: 404 });
  const pdf = await renderPdfFromUrl(runUrls(token).view);
  if (!pdf) return NextResponse.redirect(new URL(`/api/runs/view?token=${token}&auto=1`, req.url));
  const name = (found.run?.kidName ?? "dispatch").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="back-of-the-box-${name}-${found.ref.date}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
