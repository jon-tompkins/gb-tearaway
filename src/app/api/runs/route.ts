import { NextResponse } from "next/server";
import { currentUserKey, DEMO_KEY } from "@/lib/userKey";
import { readStore } from "@/lib/store";
import { listRuns } from "@/lib/runs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/runs?kidId=… — the signed-in parent's saved runs for one dispatch. */
export async function GET(req: Request) {
  const kidId = new URL(req.url).searchParams.get("kidId");
  if (!kidId) return NextResponse.json({ error: "kidId required" }, { status: 400 });
  const userKey = await currentUserKey();
  if (userKey === DEMO_KEY) return NextResponse.json({ runs: [], signedIn: false });
  const store = await readStore(userKey);
  if (!store.kids.some((k) => k.id === kidId)) return NextResponse.json({ error: "Unknown page" }, { status: 404 });
  return NextResponse.json({ runs: await listRuns(userKey, kidId), signedIn: true });
}
