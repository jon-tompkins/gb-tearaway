import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { loadPayload, savePayload } from "@/lib/persist";
import type { SupportItem } from "@/lib/support";

export const dynamic = "force-dynamic";

/** Admin: mark a support submission done (or back to new). Body: { key, status }. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { key?: string; status?: string };
  if (!body.key?.startsWith("support:") || (body.status !== "done" && body.status !== "new"))
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  const item = await loadPayload<SupportItem>(body.key);
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  await savePayload(body.key, { ...item, status: body.status });
  return NextResponse.json({ status: body.status });
}
