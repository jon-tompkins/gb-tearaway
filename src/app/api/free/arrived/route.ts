import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { freeRuntime } from "@/lib/free/runtime";
import { noteFreeCustomStart } from "@/lib/free/flow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Setup page reached with utm_source=free_edition. No email is stored on the event. */
export async function POST(req: Request) {
  if (!(await freeRuntime()).active) return new NextResponse(null, { status: 204 });
  const body = (await req.json().catch(() => ({}))) as { editionId?: unknown };
  const editionId = typeof body.editionId === "string" ? body.editionId.slice(0, 40) : null;
  const email = (await auth().catch(() => null))?.user?.email?.toLowerCase() ?? null;
  await noteFreeCustomStart(email, editionId);
  return new NextResponse(null, { status: 204 });
}
