import { NextResponse } from "next/server";
import { isAdmin, requireAdmin } from "@/lib/admin";
import { adminDenied, auditFreeChange } from "@/lib/free/adminOps";
import { loadFreeAdmin, saveFreeAdmin } from "@/lib/free/runtime";
import { validateNewEdition } from "@/lib/free/settings";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (adminDenied(await isAdmin())) return NextResponse.json({ error: "not found" }, { status: 404 });
  const actor = await requireAdmin();
  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    label?: string;
    ageKey?: string;
    timezone?: string;
    weatherCity?: string;
    weatherLat?: number;
    weatherLon?: number;
  };
  const before = await loadFreeAdmin();
  const built = validateNewEdition({
    id: body.id ?? "",
    label: body.label ?? "",
    ageKey: body.ageKey ?? "4-6",
    timezone: body.timezone ?? "",
    weatherCity: body.weatherCity,
    weatherLat: body.weatherLat,
    weatherLon: body.weatherLon,
    existingIds: before.editions.map((e) => e.id),
  });
  if (!built.ok) return NextResponse.json({ error: built.error }, { status: 400 });
  const next = { ...before, editions: [...before.editions, built.edition] };
  await saveFreeAdmin(next);
  await auditFreeChange(actor, "add-edition", null, { id: built.edition.id, label: built.edition.label });
  return NextResponse.json({ ok: true, settings: next });
}
