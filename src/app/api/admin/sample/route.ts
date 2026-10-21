import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { isModuleId, moduleSize, moduleSizes } from "@/lib/modules";
import { readStore, seedKid } from "@/lib/store";
import { buildJobForKid } from "@/lib/serverStrip";
import { buildCardSampleHtml } from "@/lib/printHtml";
import { bandFromDifficulty, effectiveDifficulty } from "@/lib/difficulty";
import type { SlotSize } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] as string);

/**
 * GET /api/admin/sample?module=…&d=1-20&size=half|full|double&seed=N
 * Admin only. Builds a throwaway dispatch holding just that module at that
 * appropriateness and card size, and returns the card exactly as it prints
 * (real Letter column width and card height), with its answer key below.
 */
export async function GET(req: Request) {
  const email = await requireAdmin();
  const p = new URL(req.url).searchParams;
  const id = p.get("module") ?? "";
  if (!isModuleId(id)) return NextResponse.json({ error: "unknown module" }, { status: 400 });
  const asked = p.get("size") as SlotSize | null;
  const size: SlotSize = asked && moduleSizes(id).includes(asked) ? asked : moduleSize(id);
  const d = effectiveDifficulty(id, Number(p.get("d") ?? 8));
  const seed = Math.abs(Math.floor(Number(p.get("seed") ?? Date.now()))) % 1_000_000;

  // Borrow the admin's own settings (weather city, timezone) and teams/watchlist.
  const userKey = `user:${email.toLowerCase()}`;
  const store = await readStore(userKey);
  const like = store.kids.find((k) => k.sportsTeams?.length) ?? store.kids[0];
  const kid = seedKid({
    id: "admin-sample",
    name: "Sample",
    ageBand: bandFromDifficulty(d),
    paperSize: "letter",
    timezone: store.settings.timezone,
    sportsTeams: like?.sportsTeams,
    watchlist: like?.watchlist,
    slots: [{ id: "sample", moduleIds: [id], mode: "single", cursor: 0, size, moduleDifficulty: { [id]: d }, column: 0 }],
  });

  const job = await buildJobForKid(kid, { userKey, nonce: seed });
  const section = job.sections.find((s) => s.moduleId === id);
  if (!section) {
    return new NextResponse(
      `<p style="font-family:ui-monospace,monospace;padding:16px">Nothing to print for this module right now (e.g. no kid-safe news cached today, or no favorite teams set).</p>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
  const foot = `<div class="sample-foot">${esc(
    `${section.title} · appropriateness ${d} · ${size === "half" ? "½" : size === "double" ? "2×" : "1×"} card · seed ${seed}` +
      (section.answer ? `\n\nAnswer key (app only):\n${section.answer}` : ""),
  )}</div>`;
  return new NextResponse(buildCardSampleHtml(job, { ...section, size }, foot), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
