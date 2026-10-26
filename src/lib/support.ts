import { loadPayload, savePayload } from "./persist";
import { sendEmail } from "./email";

export const SUPPORT_KINDS = ["module_request", "bug", "message_to_jon", "other"] as const;
export type SupportKind = (typeof SUPPORT_KINDS)[number];

export interface SupportItem {
  kind: SupportKind;
  text: string;
  email: string;
  createdAt: string;
  status: "new" | "done";
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function recordSupport(input: { kind: string; text: string; email?: string | null }): Promise<string> {
  const kind = (SUPPORT_KINDS as readonly string[]).includes(input.kind) ? (input.kind as SupportKind) : "other";
  const item: SupportItem = {
    kind,
    text: input.text.trim().slice(0, 2000),
    email: (input.email ?? "").trim().slice(0, 200),
    createdAt: new Date().toISOString(),
    status: "new",
  };
  const key = `support:${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await savePayload(key, item);
  const to = process.env.SUPPORT_NOTIFY_EMAIL;
  if (to) {
    await sendEmail({
      to,
      subject: `[Back of the Box] ${kind.replace(/_/g, " ")}`,
      html: `<p>${esc(item.text).replace(/\n/g, "<br>")}</p><p>From: ${esc(item.email || "anonymous")}</p>`,
    });
  }
  return key;
}

/**
 * Sliding-ish counters: per-minute in memory, per-day in the KV store (falls
 * back to memory when the store is unavailable). Returns true if allowed.
 */
const mem = new Map<string, { n: number; reset: number }>();

function bump(id: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (mem.size > 5000) for (const [k, v] of mem) if (v.reset < now) mem.delete(k);
  const cur = mem.get(id);
  if (!cur || cur.reset < now) {
    mem.set(id, { n: 1, reset: now + windowMs });
    return true;
  }
  cur.n++;
  return cur.n <= limit;
}

async function bumpDaily(id: string, limit: number): Promise<boolean> {
  const key = `supportrl:${new Date().toISOString().slice(0, 10)}:${id}`;
  try {
    const cur = (await loadPayload<{ n: number }>(key))?.n ?? 0;
    if (cur >= limit) return false;
    await savePayload(key, { n: cur + 1 });
    return true;
  } catch {
    return bump(`d:${id}`, limit, 86_400_000);
  }
}

export async function allowSupportMessage(ids: { visitor: string; ip: string }): Promise<boolean> {
  const perMin = bump(`m:v:${ids.visitor}`, 8, 60_000) && bump(`m:ip:${ids.ip}`, 16, 60_000);
  if (!perMin) return false;
  return (await bumpDaily(`v:${ids.visitor}`, 20)) && (await bumpDaily(`ip:${ids.ip}`, 60));
}
