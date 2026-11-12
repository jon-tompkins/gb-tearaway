import { NextResponse } from "next/server";
import { siteOrigin } from "@/lib/mcp/oauth";

export const dynamic = "force-dynamic";

/** RFC 8414 authorization server metadata. */
export function GET(req: Request) {
  const o = siteOrigin(req);
  return NextResponse.json({
    issuer: o,
    authorization_endpoint: `${o}/oauth/authorize`,
    token_endpoint: `${o}/oauth/token`,
    registration_endpoint: `${o}/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["botb"],
  });
}
