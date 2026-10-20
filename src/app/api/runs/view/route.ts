import { NextResponse } from "next/server";
import { loadRunByToken } from "@/lib/runs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUTO_PRINT = `<script>window.addEventListener("load",function(){setTimeout(function(){window.print()},300)})</script>`;

/**
 * GET /api/runs/view?token=…[&auto=1] — a saved run, exactly as delivered.
 * `auto=1` opens the print dialog. Days with no saved run (before runs were
 * kept) fall back to a fresh render of that date.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const auto = url.searchParams.get("auto") === "1";
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });
  const found = await loadRunByToken(token);
  if (!found) return NextResponse.json({ error: "Unknown or expired link" }, { status: 404 });
  if (!found.run) {
    return NextResponse.redirect(new URL(`/api/render?token=${token}&format=print${auto ? "&auto=1" : ""}`, url));
  }
  const html = auto ? found.run.html.replace(/<\/body>/i, `${AUTO_PRINT}</body>`) : found.run.html;
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
