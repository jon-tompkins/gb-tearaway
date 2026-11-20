import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { freeRuntime } from "@/lib/free/runtime";
import { keepFreeForEmail } from "@/lib/free/flow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  if (!(await freeRuntime()).active) return NextResponse.json({ error: "not found" }, { status: 404 });
  const email = (await auth().catch(() => null))?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const ok = await keepFreeForEmail(email);
  if (!ok) return NextResponse.json({ error: "No free edition on this email." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
