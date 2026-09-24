import { NextResponse } from "next/server";
import { patchStore, readStore } from "@/lib/store";
import { currentUserKey } from "@/lib/userKey";

export const runtime = "nodejs";

export async function GET() {
  const key = await currentUserKey();
  const store = await readStore(key);
  return NextResponse.json(store);
}

export async function PUT(req: Request) {
  try {
    const key = await currentUserKey();
    const body = (await req.json()) as Record<string, unknown>;
    const next = await patchStore(key, body as Parameters<typeof patchStore>[1]);
    return NextResponse.json(next);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bad request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
