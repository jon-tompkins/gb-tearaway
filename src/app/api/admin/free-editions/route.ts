import { NextResponse } from "next/server";
import { isAdmin, requireAdmin } from "@/lib/admin";
import { adminDenied, auditFreeChange, editionStats } from "@/lib/free/adminOps";
import { freeEditionsEnabled } from "@/lib/free/flag";
import { loadFreeAdmin, saveFreeAdmin } from "@/lib/free/runtime";
import { effectiveMailingAddress, normalizeFreeAdmin } from "@/lib/free/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  if (adminDenied(await isAdmin())) return NextResponse.json({ error: "not found" }, { status: 404 });
  const settings = await loadFreeAdmin();
  return NextResponse.json({
    settings,
    envOn: freeEditionsEnabled(),
    address: effectiveMailingAddress(settings),
    stats: await editionStats(settings.editions),
  });
}

export async function PUT(req: Request) {
  if (adminDenied(await isAdmin())) return NextResponse.json({ error: "not found" }, { status: 404 });
  const actor = await requireAdmin();
  const before = await loadFreeAdmin();
  const next = normalizeFreeAdmin(await req.json().catch(() => null));
  await saveFreeAdmin(next);
  await auditFreeChange(actor, "save-settings", before, next);
  return NextResponse.json({ ok: true, settings: next, address: effectiveMailingAddress(next) });
}
