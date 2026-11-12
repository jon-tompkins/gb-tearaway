import { NextResponse } from "next/server";
import { exchangeCode, refreshTokens } from "@/lib/mcp/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store", Pragma: "no-cache" };
const err = (error: string, status = 400) => NextResponse.json({ error }, { status, headers: noStore });

export async function POST(req: Request) {
  const ct = req.headers.get("content-type") ?? "";
  const f: Record<string, string> = ct.includes("json")
    ? ((await req.json().catch(() => ({}))) as Record<string, string>)
    : Object.fromEntries((await req.formData().catch(() => new FormData())).entries()) as Record<string, string>;

  if (f.grant_type === "authorization_code") {
    if (!f.code || !f.code_verifier || !f.client_id || !f.redirect_uri) return err("invalid_request");
    const r = await exchangeCode({ code: f.code, verifier: f.code_verifier, clientId: f.client_id, redirectUri: f.redirect_uri });
    return "tokens" in r ? NextResponse.json(r.tokens, { headers: noStore }) : err(r.error);
  }
  if (f.grant_type === "refresh_token") {
    if (!f.refresh_token || !f.client_id) return err("invalid_request");
    const r = await refreshTokens({ refresh: f.refresh_token, clientId: f.client_id });
    return "tokens" in r ? NextResponse.json(r.tokens, { headers: noStore }) : err(r.error);
  }
  return err("unsupported_grant_type");
}
