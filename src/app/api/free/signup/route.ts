import { NextResponse } from "next/server";
import { editionById } from "@/lib/free/editions";
import { freeEditionsEnabled } from "@/lib/free/flag";
import { clientIp, startFreeSignup } from "@/lib/free/flow";
import { allowFreeSignup } from "@/lib/free/ratelimit";
import { normalizeEmail, rejectSignup } from "@/lib/free/subscriber";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    email?: unknown;
    editionId?: unknown;
    hp_field?: unknown;
    company?: unknown;
  };
  const email = normalizeEmail(typeof body.email === "string" ? body.email : "");
  const edition = editionById(typeof body.editionId === "string" ? body.editionId : "");
  const company = typeof body.hp_field === "string" ? body.hp_field : typeof body.company === "string" ? body.company : "";
  const gate = rejectSignup({
    enabled: freeEditionsEnabled(),
    company,
    email,
    editionLive: !!edition?.live,
  });
  if (gate === "off") return NextResponse.json({ error: "not found" }, { status: 404 });
  if (gate === "honeypot") return NextResponse.json({ ok: true });
  if (gate === "email") return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  if (gate === "edition") return NextResponse.json({ error: "Pick an edition." }, { status: 400 });
  if (!(await allowFreeSignup({ email, ip: clientIp(req) }))) {
    return NextResponse.json({ error: "Too many tries. Please wait and try again." }, { status: 429 });
  }
  const result = await startFreeSignup(email, edition!);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
