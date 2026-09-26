import Anthropic from "@anthropic-ai/sdk";
import type { AgeBand, ModuleId } from "../types";
import { loadPayload, savePayload } from "../persist";
import { parseISODate } from "../dates";

const MODEL = "claude-haiku-4-5";
const BANDS: AgeBand[] = ["4-6", "7-9", "10-12"];

export interface LiveHistoryEntry {
  year: string;
  text: string;
  bands: AgeBand[];
}

const SYSTEM = `You turn real "on this day in history" events into short, kid-safe history facts for a children's printed morning paper. You are the safety filter and the writer.

STRICT — DROP any event about: death, killing, war, battles, violence, weapons, crime, terrorism, disasters/accidents, disease/plague, slavery's cruelty, executions, coups, riots, or anything scary, sad, or adult. When unsure, drop it.

KEEP only wholesome, curiosity-sparking milestones: inventions, discoveries, exploration, space firsts, science, medicine-that-helps, art, music, books, sports firsts/records, famous openings, and the births of scientists, artists, inventors, explorers, or athletes.

For each KEPT event write, grounded in the real fact (do NOT invent events or fake specifics):
- year: the real year as given (keep "BCE"/"BC" if present)
- text: 1-2 short sentences a 7-year-old understands, factual to the real event, <= 30 words
- bands: which of "4-6","7-9","10-12" it suits (array)

Return ONLY minified JSON: {"items":[{"year","text","bands"}]}. No prose, no markdown. If nothing is appropriate, return {"items":[]}.`;

function parse(text: string): LiveHistoryEntry[] {
  const s = text.indexOf("{"), e = text.lastIndexOf("}");
  if (s < 0 || e < 0) return [];
  let data: unknown;
  try {
    data = JSON.parse(text.slice(s, e + 1));
  } catch {
    return [];
  }
  const items = (data as { items?: unknown[] })?.items;
  if (!Array.isArray(items)) return [];
  const out: LiveHistoryEntry[] = [];
  for (const raw of items) {
    const o = raw as Record<string, unknown>;
    const txt = typeof o.text === "string" ? o.text.trim() : "";
    if (!txt) continue;
    const bands = Array.isArray(o.bands)
      ? (o.bands.filter((b) => BANDS.includes(b as AgeBand)) as AgeBand[])
      : [];
    out.push({
      year: typeof o.year === "string" ? o.year.trim() : String(o.year ?? "").trim(),
      text: txt,
      bands: bands.length ? bands : ["7-9", "10-12"],
    });
  }
  return out;
}

interface RawEvent {
  year?: number | string;
  text?: string;
}

async function fetchOnThisDay(mm: string, dd: string): Promise<RawEvent[]> {
  const base = "https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday";
  const headers = { "User-Agent": "BackOfTheBox/1.0 (kids morning paper; contact via app)" };
  const out: RawEvent[] = [];
  await Promise.all(
    ["selected", "events"].map(async (kind) => {
      try {
        const res = await fetch(`${base}/${kind}/${mm}/${dd}`, { headers });
        if (!res.ok) return;
        const data = (await res.json()) as { events?: RawEvent[]; selected?: RawEvent[] };
        const arr = data.events ?? data.selected ?? [];
        for (const ev of arr) if (ev?.text) out.push({ year: ev.year, text: ev.text });
      } catch {
        /* ignore */
      }
    }),
  );
  return out;
}

/**
 * Real "this day in history", kid-safe (Wikimedia → Haiku filter), cached by
 * month-day (stable year to year). Returns null on any failure → static bank.
 */
export async function getDailyHistory(iso: string): Promise<LiveHistoryEntry[] | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const { month, day } = parseISODate(iso);
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const key = `history:${mm}-${dd}`;

  const cached = await loadPayload<{ items: LiveHistoryEntry[] }>(key);
  if (cached) return cached.items.length ? cached.items : null;

  const events = await fetchOnThisDay(mm, dd);
  if (events.length === 0) return null;
  let items: LiveHistoryEntry[] = [];
  try {
    const client = new Anthropic();
    const list = events
      .slice(0, 40)
      .map((e, i) => `${i + 1}. ${e.year ?? "?"} — ${e.text}`)
      .join("\n");
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM,
      messages: [
        { role: "user", content: `Real events for this date. Keep only kid-safe ones:\n\n${list}` },
      ],
    });
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    items = parse(text);
  } catch {
    return null;
  }
  await savePayload(key, { items });
  return items.length ? items : null;
}

/** Gather live history only when a dispatch actually uses the history module. */
export async function gatherDailyHistory(
  pool: ModuleId[],
  iso: string,
): Promise<LiveHistoryEntry[] | undefined> {
  if (!pool.includes("history")) return undefined;
  const items = await getDailyHistory(iso);
  return items ?? undefined;
}
