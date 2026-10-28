import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { createCode, listCodes, setCodeDisabled } from "@/lib/billing";

export const dynamic = "force-dynamic";

async function admin() {
  return isAdmin();
}
const notFound = () => NextResponse.json({ error: "not found" }, { status: 404 });

export async function GET() {
  if (!(await admin())) return notFound();
  return NextResponse.json({ codes: await listCodes() });
}

/** Create a code. Body: { code?, months (0 = forever), maxUses (0 = unlimited), note? }. */
export async function POST(req: Request) {
  if (!(await admin())) return notFound();
  const b = (await req.json().catch(() => ({}))) as { code?: string; months?: number; maxUses?: number; note?: string };
  try {
    const code = await createCode({ code: b.code, months: Number(b.months ?? 1), maxUses: Number(b.maxUses ?? 1), note: b.note });
    return NextResponse.json({ code });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 400 });
  }
}

/** Turn a code off or back on. Body: { code, disabled }. */
export async function PATCH(req: Request) {
  if (!(await admin())) return notFound();
  const b = (await req.json().catch(() => ({}))) as { code?: string; disabled?: boolean };
  const code = b.code ? await setCodeDisabled(b.code, !!b.disabled) : null;
  return code ? NextResponse.json({ code }) : NextResponse.json({ error: "no such code" }, { status: 404 });
}
