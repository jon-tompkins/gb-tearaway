import { NextResponse } from "next/server";
import { registerClient } from "@/lib/mcp/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** RFC 7591 dynamic client registration (public clients). */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const c = await registerClient(body);
  if ("error" in c) return NextResponse.json({ error: "invalid_client_metadata", error_description: c.error }, { status: 400 });
  return NextResponse.json(
    {
      client_id: c.client_id,
      client_name: c.client_name,
      redirect_uris: c.redirect_uris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    },
    { status: 201 },
  );
}
