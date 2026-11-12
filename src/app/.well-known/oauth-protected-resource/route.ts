import { NextResponse } from "next/server";
import { siteOrigin } from "@/lib/mcp/oauth";

export const dynamic = "force-dynamic";

/** RFC 9728: tells an MCP client which authorization server protects /mcp. */
export function GET(req: Request) {
  const o = siteOrigin(req);
  return NextResponse.json({
    resource: `${o}/mcp`,
    authorization_servers: [o],
    scopes_supported: ["botb"],
    bearer_methods_supported: ["header"],
    resource_name: "Back of the Box",
  });
}
