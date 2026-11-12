import { NextResponse } from "next/server";
import { verifyBearer, siteOrigin } from "@/lib/mcp/oauth";
import { TOOLS, callTool } from "@/lib/mcp/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Back of the Box MCP server (streamable HTTP, stateless, JSON responses).
 * Add to an assistant as a custom connector: https://www.backofthebox.xyz/mcp
 */
const VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const INSTRUCTIONS =
  "Back of the Box prints a fresh daily puzzle page (crosswords, sudoku, word finds, poems, trivia, weather) for one person. " +
  "To help someone: ask what they enjoy, call list_interests, build_page, show them get_todays_page, then ask before turning on daily delivery (update_page active=true). " +
  "Difficulty is about puzzle level, not age: never talk down to anyone, and never call a page 'for old people'.";

type Rpc = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };
const ok = (id: Rpc["id"], result: unknown) => ({ jsonrpc: "2.0", id: id ?? null, result });
const fail = (id: Rpc["id"], code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

function unauthorized(req: Request) {
  const o = siteOrigin(req);
  return new NextResponse(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json", "WWW-Authenticate": `Bearer resource_metadata="${o}/.well-known/oauth-protected-resource"` },
  });
}

async function handle(m: Rpc, ctx: { userKey: string; email: string; origin: string }) {
  switch (m.method) {
    case "initialize": {
      const asked = String(m.params?.protocolVersion ?? "");
      return ok(m.id, {
        protocolVersion: VERSIONS.includes(asked) ? asked : VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "back-of-the-box", title: "Back of the Box", version: "0.1.0" },
        instructions: INSTRUCTIONS,
      });
    }
    case "ping":
      return ok(m.id, {});
    case "tools/list":
      return ok(m.id, {
        tools: TOOLS.map((t) => ({
          name: t.name,
          title: t.title,
          description: t.description,
          inputSchema: t.inputSchema,
          annotations: { readOnlyHint: t.readOnly, destructiveHint: false, openWorldHint: false },
        })),
      });
    case "tools/call":
      return ok(m.id, await callTool(String(m.params?.name ?? ""), (m.params?.arguments ?? {}) as Record<string, unknown>, ctx));
    default:
      return fail(m.id, -32601, `Method not found: ${m.method}`);
  }
}

export async function POST(req: Request) {
  const who = await verifyBearer(req);
  if (!who) return unauthorized(req);
  const body = (await req.json().catch(() => null)) as Rpc | Rpc[] | null;
  if (!body) return NextResponse.json(fail(null, -32700, "Parse error"), { status: 400 });
  const ctx = { ...who, origin: siteOrigin(req) };
  const run = async (m: Rpc) => (m.id === undefined || m.method?.startsWith("notifications/") ? null : handle(m, ctx));
  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map(run))).filter(Boolean);
    return out.length ? NextResponse.json(out) : new NextResponse(null, { status: 202 });
  }
  const out = await run(body);
  return out ? NextResponse.json(out) : new NextResponse(null, { status: 202 });
}

/** No server-initiated stream and no sessions to end. */
export function GET() {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}
export function DELETE() {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}
