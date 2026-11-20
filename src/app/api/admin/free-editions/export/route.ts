import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { adminDenied, editionCsv } from "@/lib/free/adminOps";
import { listSubscribers } from "@/lib/free/repo";
import { loadFreeAdmin } from "@/lib/free/runtime";

export const dynamic = "force-dynamic";

/** CSV of one edition, only after an explicit confirm. Emails are in the file, not on the page. */
export async function POST(req: Request) {
  if (adminDenied(await isAdmin())) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { editionId?: string; confirm?: boolean };
  if (!body.confirm) return NextResponse.json({ error: "Confirm the export first." }, { status: 400 });
  const settings = await loadFreeAdmin();
  if (!settings.editions.some((e) => e.id === body.editionId)) return NextResponse.json({ error: "Unknown edition." }, { status: 404 });
  const csv = editionCsv(await listSubscribers(), body.editionId!);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="free-${body.editionId}.csv"`,
    },
  });
}
