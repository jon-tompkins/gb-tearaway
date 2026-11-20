import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { freeNoticeForEmail } from "@/lib/free/flow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const email = (await auth().catch(() => null))?.user?.email?.toLowerCase() ?? null;
  return NextResponse.json(await freeNoticeForEmail(email));
}
