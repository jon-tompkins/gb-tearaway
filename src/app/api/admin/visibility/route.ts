import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { isModuleId } from "@/lib/modules";
import { setModuleHidden } from "@/lib/visibility";

export const dynamic = "force-dynamic";

/** Admin: hide or show a module. Body: { id, hidden }. */
export async function POST(req: Request) {
  const session = await auth().catch(() => null);
  if (!isAdminEmail(session?.user?.email)) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { id?: string; hidden?: boolean };
  if (!body.id || !isModuleId(body.id)) return NextResponse.json({ error: "bad module" }, { status: 400 });
  const hidden = await setModuleHidden(body.id, !!body.hidden);
  return NextResponse.json({ hidden });
}
