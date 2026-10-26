import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { logEvent } from "@/lib/events";
import { allowSupportMessage, recordSupport, SUPPORT_KINDS } from "@/lib/support";
import { buildSupportPrompt, SUPPORT_FALLBACK_EMAIL } from "@/lib/supportKnowledge";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = "claude-haiku-4-5";
const MAX_MESSAGES = 12;
const MAX_CHARS = 1000;
const MAX_TOOL_ROUNDS = 3;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "submit_feedback",
    description:
      "Record a module request, bug report, or message for the founder. Call only after the user clearly wants it sent.",
    input_schema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: [...SUPPORT_KINDS] },
        text: { type: "string", description: "The request or message, written clearly in the user's words." },
        contact_email: { type: "string", description: "Email for a reply, if the user gave one." },
      },
      required: ["kind", "text"],
    },
  },
];

const reply = (message: string, status = 200) => NextResponse.json({ message }, { status });

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    messages?: Array<{ role?: string; content?: string }>;
    visitor?: string;
  };
  const messages: Anthropic.MessageParam[] = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content!.slice(0, MAX_CHARS) }));
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") return reply("Say something and I'll help.", 400);

  if (!process.env.ANTHROPIC_API_KEY) {
    return reply(`Support chat is offline right now. Please email ${SUPPORT_FALLBACK_EMAIL} and Jon will get back to you.`);
  }

  const session = await auth().catch(() => null);
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const visitor = String(body.visitor ?? "").slice(0, 64) || `ip-${ip}`;
  if (!(await allowSupportMessage({ visitor, ip }))) {
    return reply("You've sent a lot of messages in a short time. Please try again later, or email " + SUPPORT_FALLBACK_EMAIL + ".", 429);
  }

  const client = new Anthropic();
  const system = await buildSupportPrompt();
  const signedInEmail = session?.user?.email ?? "";
  let inTokens = 0;
  let outTokens = 0;
  try {
    for (let round = 0; ; round++) {
      const res = await client.messages.create({
        model: MODEL,
        max_tokens: 500,
        system: signedInEmail ? `${system}\n\nThe user is signed in; replies go to their account email automatically.` : system,
        tools: round < MAX_TOOL_ROUNDS ? TOOLS : undefined,
        messages,
      });
      inTokens += res.usage.input_tokens;
      outTokens += res.usage.output_tokens;
      const uses = res.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
      if (res.stop_reason === "tool_use" && uses.length && round < MAX_TOOL_ROUNDS) {
        messages.push({ role: "assistant", content: res.content });
        const results: Anthropic.ToolResultBlockParam[] = [];
        for (const u of uses) {
          const input = u.input as { kind?: string; text?: string; contact_email?: string };
          let content = "Could not record that.";
          if (u.name === "submit_feedback" && input.text?.trim()) {
            try {
              await recordSupport({ kind: input.kind ?? "other", text: input.text, email: signedInEmail || input.contact_email });
              content = "Recorded. Jon will see it.";
            } catch {
              content = "Saving failed. Tell the user to email " + SUPPORT_FALLBACK_EMAIL + ".";
            }
          }
          results.push({ type: "tool_result", tool_use_id: u.id, content });
        }
        messages.push({ role: "user", content: results });
        continue;
      }
      const text = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      void logEvent({
        type: "ai_usage",
        visitor,
        meta: { feature: "support", model: MODEL, input: inTokens, output: outTokens, usd: (inTokens * 1 + outTokens * 5) / 1e6 },
      });
      return reply(text || "Sorry, I didn't catch that. Could you rephrase?");
    }
  } catch {
    return reply(`Sorry, something went wrong. You can email ${SUPPORT_FALLBACK_EMAIL} instead.`, 500);
  }
}
