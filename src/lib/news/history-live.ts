import Anthropic from "@anthropic-ai/sdk";
import type { AgeBand, ModuleId } from "../types";
import { loadPayload, savePayload } from "../persist";
import { parseISODate } from "../dates";

const MODEL = "claude-sonnet-5-5";
const BANDS: AgeBand[] = ["4-6", "7-9", "10-12"];

export const HISTORY_CATEGORIES = [
  "Inventions",
  "Science",
  "Space & exploration",
  "Sports",
  "Battles & turning points",
  "Arts & books",
  "Music & movies",
  "Buildings & places",
  "Famous births",
  "Firsts & oddities",
] as const;

export interface LiveHistoryEntry {
  year: string;
  /** One of HISTORY_CATEGORIES (shown next to the year). */
  category?: string;
  text: string;
  bands: AgeBand[];
}

const SYSTEM = `You build the "This Day in History" card for a printed morning paper for kids aged 4-12. You get a numbered list of real events and births for one calendar date (from Wikipedia). Pick a WIDE, interesting mix and write each one for kids.

Aim for 10-14 entries spread across as many of these categories as the list allows (at most 3 per category):
${HISTORY_CATEGORIES.map((c) => `- ${c}`).join("\n")}

What makes a good pick: something a kid would repeat at breakfast. Inventions and patents, discoveries, expeditions and space missions, unusual or record-breaking sports moments (first games, odd matches, famous upsets, firsts in a sport), famous battles and turning points that changed history, books/art/music/films/games released, famous buildings and bridges opened, quirky firsts, and births of inventors, scientists, explorers, artists, athletes and writers kids may know.

Battles & turning points ARE allowed, written like a good kids' history book: who was on each side, what it decided, and why it mattered. No gore, no casualty numbers, no cruelty details; mark them "7-9","10-12" only. Still DROP: terrorism, massacres, genocide, executions, assassinations, disasters with deaths, crimes, abuse, disease outbreaks, and modern partisan politics.

For each entry:
- year: the real year exactly as given (keep "BC"/"BCE").
- category: exactly one of the category names above.
- text: 1-2 short sentences, AT MOST 32 WORDS, plain words a 7-year-old can follow, specific (names, places, numbers from the list). For births: "<Name> was born. <what they did later>". Use only facts in the list plus basic, universally known facts about the same person or event. Never invent details. No "Did you know", no exclamation marks.
- bands: which of "4-6","7-9","10-12" can follow it.

Return ONLY minified JSON: {"items":[{"year","category","text","bands"}]}. No prose, no markdown.`;

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
    const category = typeof o.category === "string" ? o.category.trim() : "";
    if (txt.split(/\s+/).length > 45) continue;
    out.push({
      year: typeof o.year === "string" ? o.year.trim() : String(o.year ?? "").trim(),
      category: (HISTORY_CATEGORIES as readonly string[]).includes(category) ? category : undefined,
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
  const url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/${mm}/${dd}`;
  const headers = { "User-Agent": "BackOfTheBox/1.0 (kids morning paper; contact via app)" };
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const data = (await res.json()) as Partial<Record<"selected" | "events" | "births", RawEvent[]>>;
    const seen = new Set<string>();
    const out: RawEvent[] = [];
    for (const [kind, list] of [["", data.selected], ["", data.events], ["BORN: ", data.births]] as const) {
      for (const ev of list ?? []) {
        if (!ev?.text || seen.has(ev.text)) continue;
        seen.add(ev.text);
        out.push({ year: ev.year, text: kind + ev.text });
      }
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Real "this day in history" (Wikimedia → Sonnet picks a 10-14 item mix across
 * categories), cached by month-day (stable year to year; all 366 pre-built by
 * /api/cron/history). Returns null on any failure → static bank.
 */
export async function getDailyHistory(
  iso: string,
  opts: { cachedOnly?: boolean } = {},
): Promise<LiveHistoryEntry[] | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const { month, day } = parseISODate(iso);
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const key = `history2:${mm}-${dd}`;

  const cached = await loadPayload<{ items: LiveHistoryEntry[] }>(key);
  if (cached) return cached.items.length ? cached.items : null;
  if (opts.cachedOnly) return null;

  const events = await fetchOnThisDay(mm, dd);
  if (events.length === 0) return null;
  let items: LiveHistoryEntry[] = [];
  try {
    // Events first (they're the bulk), then births; ~180 lines keeps the call small.
    const evs = events.filter((e) => !e.text?.startsWith("BORN: ")).slice(0, 120);
    const births = events.filter((e) => e.text?.startsWith("BORN: ")).slice(0, 60);
    const list = [...evs, ...births].map((e, i) => `${i + 1}. ${e.year ?? "?"} — ${e.text}`).join("\n");
    const msg = await new Anthropic().messages
      .stream({
        model: MODEL,
        max_tokens: 16000,
        system: SYSTEM,
        output_config: { effort: "low" },
        messages: [{ role: "user", content: `Real events and births for ${month}/${day}:\n\n${list}` }],
      })
      .finalMessage();
    if (msg.stop_reason !== "end_turn") return null;
    items = parse(msg.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim());
  } catch {
    return null;
  }
  if (items.length) await savePayload(key, { items });
  return items.length ? items : null;
}

/** Gather live history only when a dispatch actually uses the history module. */
export async function gatherDailyHistory(
  pool: ModuleId[],
  iso: string,
): Promise<LiveHistoryEntry[] | undefined> {
  if (!pool.includes("history")) return undefined;
  // Renders never wait on a model call: the warm-up cron builds every day ahead
  // of time. Before a day is built, use last version's cache, then the static bank.
  const items = await getDailyHistory(iso, { cachedOnly: true });
  if (items) return items;
  const { month, day } = parseISODate(iso);
  const legacy = await loadPayload<{ items: LiveHistoryEntry[] }>(
    `history:${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  );
  return legacy?.items.length ? legacy.items : undefined;
}
