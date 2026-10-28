import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { isModuleId } from "@/lib/modules";
import { setModuleHidden } from "@/lib/visibility";

export const dynamic = "force-dynamic";

/** Admin: hide or show a module. Body: { id, hidden }. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { id?: string; hidden?: boolean };
  if (!body.id || !isModuleId(body.id)) return NextResponse.json({ error: "bad module" }, { status: 400 });
  const hidden = await setModuleHidden(body.id, !!body.hidden);
  return NextResponse.json({ hidden });
}
