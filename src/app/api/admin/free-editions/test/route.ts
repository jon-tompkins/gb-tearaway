import { NextResponse } from "next/server";
import { isAdmin, requireAdmin } from "@/lib/admin";
import { adminDenied, auditFreeChange, sendAdminTest } from "@/lib/free/adminOps";
import { loadFreeAdmin } from "@/lib/free/runtime";
import { effectiveMailingAddress } from "@/lib/free/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  if (adminDenied(await isAdmin())) return NextResponse.json({ error: "not found" }, { status: 404 });
  const actor = await requireAdmin();
  const body = (await req.json().catch(() => ({}))) as { to?: string; kind?: string; editionId?: string };
  const settings = await loadFreeAdmin();
  const edition = settings.editions.find((e) => e.id === body.editionId && !e.archived);
  if (!edition) return NextResponse.json({ error: "Unknown edition." }, { status: 404 });
  const kind = body.kind === "edition" ? "edition" : "confirm";
  const result = await sendAdminTest({
    to: typeof body.to === "string" && body.to.trim() ? body.to : actor,
    kind,
    edition,
    upgradeText: settings.upgradeText,
    address: effectiveMailingAddress(settings),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  await auditFreeChange(actor, "test-send", null, { kind, editionId: edition.id });
  return NextResponse.json({ ok: true });
}
