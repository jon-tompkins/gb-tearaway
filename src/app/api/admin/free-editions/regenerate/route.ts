import { NextResponse } from "next/server";
import { isAdmin, requireAdmin } from "@/lib/admin";
import { adminDenied, alreadySentToday, auditFreeChange, regenerateEditionPdf } from "@/lib/free/adminOps";
import { loadFreeAdmin } from "@/lib/free/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  if (adminDenied(await isAdmin())) return NextResponse.json({ error: "not found" }, { status: 404 });
  const actor = await requireAdmin();
  const body = (await req.json().catch(() => ({}))) as { editionId?: string; confirm?: boolean };
  const settings = await loadFreeAdmin();
  const edition = settings.editions.find((e) => e.id === body.editionId && !e.archived);
  if (!edition) return NextResponse.json({ error: "Unknown edition." }, { status: 404 });
  const sent = await alreadySentToday(edition);
  if (sent > 0 && !body.confirm) {
    return NextResponse.json({
      warn: true,
      sent,
      message: `Already sent to ${sent} confirmed subscriber${sent === 1 ? "" : "s"} today. Regenerating replaces the cached PDF and does not resend.`,
    });
  }
  await regenerateEditionPdf(edition, settings.upgradeText);
  await auditFreeChange(actor, "regenerate-pdf", { sentToday: sent }, { editionId: edition.id, resent: false });
  return NextResponse.json({ ok: true, resent: false });
}
