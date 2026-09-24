import { NextResponse } from "next/server";
import { getActiveKid, readStore } from "@/lib/store";
import { currentUserKey } from "@/lib/userKey";

export const runtime = "nodejs";

export async function GET() {
  const store = await readStore(await currentUserKey());
  const kid = await getActiveKid(store);
  if (!kid) {
    return NextResponse.json({ error: "No kid profile" }, { status: 404 });
  }
  const job = store.lastPrintByKid[kid.id];
  if (!job) {
    return NextResponse.json({ error: "No print job yet — POST print-now first" }, { status: 404 });
  }
  return NextResponse.json(job);
}
