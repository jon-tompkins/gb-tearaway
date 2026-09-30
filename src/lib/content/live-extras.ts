import Anthropic from "@anthropic-ai/sdk";
import type { AgeBand, FactItem, ModuleId } from "../types";
import type { JokeItem } from "./jokes";
import { loadPayload, savePayload } from "../persist";
import { shuffle } from "../rng";

/**
 * Fresh daily jokes + fun facts, generated kid-safe by Haiku and cached once per
 * UTC day (globally, like the news pipeline — one call per day for everyone).
 * Unlike news, these DO have a static fallback: if the model is unavailable the
 * caller uses the hand-written banks so a card always prints.
 */

const MODEL = "claude-haiku-4-5";
const BANDS: AgeBand[] = ["4-6", "7-9", "10-12"];

export type LiveJoke = JokeItem & { bands: AgeBand[] };
export type LiveFact = FactItem & { bands: AgeBand[] };

export interface DailyExtras {
  jokes?: LiveJoke[];
  facts?: LiveFact[];
}

function utcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseBands(v: unknown): AgeBand[] {
  const b = Array.isArray(v)
    ? (v.filter((x) => BANDS.includes(x as AgeBand)) as AgeBand[])
    : [];
  return b.length ? b : ["7-9", "10-12"];
}

function jsonObject(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function haiku(system: string, user: string): Promise<string> {
  const client = new Anthropic();
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1800,
    system,
    messages: [{ role: "user", content: user }],
  });
  return res.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();
}

const JOKE_SYSTEM = `You write clean, genuinely funny jokes for a printed children's morning paper.

Write 14 jokes as a mix of puns, riddles, and knock-knocks. Every joke must be:
- G-rated and kind (no violence, insults, bathroom gross-out, stereotypes, or anything scary/adult)
- actually funny with a satisfying pun or twist — avoid tired, over-used ones
- self-contained: a short "setup" line and a short "punchline" line

Spread them across three reading levels and tag each with the bands it suits:
- "4-6": very simple words, silly and obvious
- "7-9": light wordplay a new reader gets
- "10-12": cleverer puns / double meanings
A joke may list more than one band.

Return ONLY minified JSON: {"jokes":[{"setup","punchline","bands"}]}. No prose, no markdown.`;

const FACT_SYSTEM = `You write true "did you know" fun facts for a printed children's morning paper.

Write 14 facts. Every fact must be:
- TRUE and well-established — if you are not confident it is accurate, do not include it. Never invent numbers or specifics.
- genuinely surprising or delightful (animals, space, nature, science, history, the human body, records, how things work)
- kid-safe: nothing scary, sad, violent, or adult
- two parts: "fact" (one punchy sentence) and "extra" (one short sentence that adds context)

Spread them across three reading levels and tag each with the bands it suits:
- "4-6": simple and concrete
- "7-9": a bit more detail
- "10-12": can handle bigger numbers / ideas
A fact may list more than one band.

Return ONLY minified JSON: {"facts":[{"fact","extra","bands"}]}. No prose, no markdown.`;

async function generateJokes(): Promise<LiveJoke[]> {
  if (!process.env.ANTHROPIC_API_KEY) return [];
  try {
    const obj = jsonObject(await haiku(JOKE_SYSTEM, "Write today's jokes."));
    const arr = obj?.jokes;
    if (!Array.isArray(arr)) return [];
    const out: LiveJoke[] = [];
    for (const raw of arr) {
      const o = raw as Record<string, unknown>;
      const setup = typeof o.setup === "string" ? o.setup.trim() : "";
      const punchline = typeof o.punchline === "string" ? o.punchline.trim() : "";
      if (!setup || !punchline) continue;
      out.push({ setup, punchline, bands: parseBands(o.bands) });
    }
    return out;
  } catch {
    return [];
  }
}

async function generateFacts(): Promise<LiveFact[]> {
  if (!process.env.ANTHROPIC_API_KEY) return [];
  try {
    const obj = jsonObject(await haiku(FACT_SYSTEM, "Write today's fun facts."));
    const arr = obj?.facts;
    if (!Array.isArray(arr)) return [];
    const out: LiveFact[] = [];
    for (const raw of arr) {
      const o = raw as Record<string, unknown>;
      const fact = typeof o.fact === "string" ? o.fact.trim() : "";
      const extra = typeof o.extra === "string" ? o.extra.trim() : "";
      if (!fact) continue;
      out.push({ fact, extra, bands: parseBands(o.bands) });
    }
    return out;
  } catch {
    return [];
  }
}

async function getDaily<T>(key: string, gen: () => Promise<T[]>): Promise<T[]> {
  const date = utcDate();
  const cacheKey = `${key}:${date}`;
  const cached = await loadPayload<{ date: string; items: T[] }>(cacheKey);
  if (cached?.date === date) return cached.items;
  const items = await gen();
  // Cache even an empty result so a bad model day doesn't retry all day; the
  // caller simply falls back to the static bank when items is empty.
  await savePayload(cacheKey, { date, items });
  return items;
}

/** Prefetch today's live jokes/facts for the modules present in a pool. */
export async function gatherDailyExtras(pool: ModuleId[]): Promise<DailyExtras | undefined> {
  const wantJokes = pool.includes("joke");
  const wantFacts = pool.includes("fact");
  if (!wantJokes && !wantFacts) return undefined;
  const [jokes, facts] = await Promise.all([
    wantJokes ? getDaily("jokes", generateJokes) : Promise.resolve<LiveJoke[]>([]),
    wantFacts ? getDaily("facts", generateFacts) : Promise.resolve<LiveFact[]>([]),
  ]);
  const out: DailyExtras = {};
  if (jokes.length) out.jokes = jokes;
  if (facts.length) out.facts = facts;
  return out.jokes || out.facts ? out : undefined;
}

/** Pick one band-appropriate joke from the live pool (null → use static bank). */
export function pickLiveJoke(pool: LiveJoke[], band: AgeBand, rng: () => number): JokeItem | null {
  const fit = pool.filter((j) => j.bands.includes(band));
  const src = fit.length ? fit : pool;
  if (!src.length) return null;
  const j = shuffle(rng, src)[0];
  return { setup: j.setup, punchline: j.punchline };
}

/** Pick one band-appropriate fact from the live pool (null → use static bank). */
export function pickLiveFact(pool: LiveFact[], band: AgeBand, rng: () => number): FactItem | null {
  const fit = pool.filter((f) => f.bands.includes(band));
  const src = fit.length ? fit : pool;
  if (!src.length) return null;
  const f = shuffle(rng, src)[0];
  return { fact: f.fact, extra: f.extra };
}
