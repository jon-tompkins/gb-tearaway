import Anthropic from "@anthropic-ai/sdk";
import type { AgeBand, FactItem, ModuleId, WordItem } from "../types";
import type { JokeItem } from "./jokes";
import type { SpanishItem } from "./spanish";
import type { ScrambleItem } from "./scramble";
import type { RiddleItem } from "./riddles";
import { loadPayload, savePayload } from "../persist";
import { shuffle } from "../rng";

/**
 * Fresh daily "content bites" — jokes, facts, word of the day, Spanish word,
 * word scramble, riddle — generated kid-safe by Haiku and cached once per UTC
 * day (globally, like the news pipeline — one call per type per day for
 * everyone). Each DOES have a static fallback: if the model is unavailable the
 * caller uses the hand-written banks so a card always prints.
 */

const MODEL = "claude-haiku-4-5";
const BANDS: AgeBand[] = ["4-6", "7-9", "10-12"];

export type LiveJoke = JokeItem & { bands: AgeBand[] };
export type LiveFact = FactItem & { bands: AgeBand[] };
export type LiveWord = WordItem & { bands: AgeBand[] };
export type LiveSpanish = SpanishItem & { bands: AgeBand[] };
export type LiveScramble = ScrambleItem & { bands: AgeBand[] };
export type LiveRiddle = RiddleItem & { bands: AgeBand[] };

export interface DailyExtras {
  jokes?: LiveJoke[];
  facts?: LiveFact[];
  words?: LiveWord[];
  spanish?: LiveSpanish[];
  scramble?: LiveScramble[];
  riddles?: LiveRiddle[];
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

const WORD_SYSTEM = `You choose a "word of the day" for a printed children's morning paper.

Write 12 real English words worth learning. For each give:
- word: the word, lowercase
- phonetic: a simple respelling for an English speaker, CAPS on the stressed syllable (e.g. "KYUR-ee-us")
- pos: part of speech, abbreviated ("adj.", "n.", "v.", "adv.")
- definition: a correct, kid-friendly one-line meaning
- example: a natural sentence using the word
- tryThis: a tiny activity or challenge using the word
- bands: which of "4-6","7-9","10-12" it suits (array)

Everything must be ACCURATE. Spread across bands: "4-6" short/common, "7-9" mid, "10-12" richer.

Return ONLY minified JSON: {"words":[{"word","phonetic","pos","definition","example","tryThis","bands"}]}. No prose, no markdown.`;

const SPANISH_SYSTEM = `You choose a "Spanish word of the day" for a printed children's morning paper.

Write 12 useful Spanish words. For each give:
- spanish: the Spanish word (include the article el/la for nouns where natural)
- phonetic: a simple respelling for an English speaker, CAPS on the stressed syllable (e.g. "GAH-toh")
- english: the correct English meaning
- example: a fun sentence that drops the Spanish word into an otherwise English sentence
- bands: which of "4-6","7-9","10-12" it suits (array)

Everything must be ACCURATE Spanish. Spread across bands: "4-6" concrete nouns/colors/numbers, "7-9" everyday words/verbs, "10-12" richer words/short phrases.

Return ONLY minified JSON: {"words":[{"spanish","phonetic","english","example","bands"}]}. No prose, no markdown.`;

const SCRAMBLE_SYSTEM = `You choose words for a "word scramble" in a printed children's morning paper (the app scrambles the letters; you just supply the word + a clue).

Write 12 entries. For each give:
- word: a single lowercase common word, letters only (no spaces/punctuation)
- hint: a short kid-friendly clue that does NOT contain the word itself
- bands: which of "4-6","7-9","10-12" it suits (array)

Spread across bands: "4-6" 3-4 letters, "7-9" 4-6 letters, "10-12" 6-8 letters.

Return ONLY minified JSON: {"words":[{"word","hint","bands"}]}. No prose, no markdown.`;

const RIDDLE_SYSTEM = `You write riddles for a printed children's morning paper.

Write 12 riddles. Each must be G-rated, kind, genuinely solvable, with a short correct answer. For each give:
- question: the riddle
- answer: the correct concise answer
- bands: which of "4-6","7-9","10-12" it suits (array)

Spread across bands: "4-6" simple/obvious, "7-9" light wordplay, "10-12" cleverer.

Return ONLY minified JSON: {"riddles":[{"question","answer","bands"}]}. No prose, no markdown.`;

async function generateWords(): Promise<LiveWord[]> {
  if (!process.env.ANTHROPIC_API_KEY) return [];
  try {
    const obj = jsonObject(await haiku(WORD_SYSTEM, "Choose today's words of the day."));
    const arr = obj?.words;
    if (!Array.isArray(arr)) return [];
    const out: LiveWord[] = [];
    for (const raw of arr) {
      const o = raw as Record<string, unknown>;
      const word = typeof o.word === "string" ? o.word.trim() : "";
      const definition = typeof o.definition === "string" ? o.definition.trim() : "";
      if (!word || !definition) continue;
      out.push({
        word,
        phonetic: typeof o.phonetic === "string" ? o.phonetic.trim() : "",
        pos: typeof o.pos === "string" ? o.pos.trim() : "",
        definition,
        example: typeof o.example === "string" ? o.example.trim() : "",
        tryThis: typeof o.tryThis === "string" ? o.tryThis.trim() : "",
        bands: parseBands(o.bands),
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function generateSpanish(): Promise<LiveSpanish[]> {
  if (!process.env.ANTHROPIC_API_KEY) return [];
  try {
    const obj = jsonObject(await haiku(SPANISH_SYSTEM, "Choose today's Spanish words."));
    const arr = obj?.words;
    if (!Array.isArray(arr)) return [];
    const out: LiveSpanish[] = [];
    for (const raw of arr) {
      const o = raw as Record<string, unknown>;
      const spanish = typeof o.spanish === "string" ? o.spanish.trim() : "";
      const english = typeof o.english === "string" ? o.english.trim() : "";
      if (!spanish || !english) continue;
      out.push({
        spanish,
        phonetic: typeof o.phonetic === "string" ? o.phonetic.trim() : "",
        english,
        example: typeof o.example === "string" ? o.example.trim() : "",
        bands: parseBands(o.bands),
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function generateScramble(): Promise<LiveScramble[]> {
  if (!process.env.ANTHROPIC_API_KEY) return [];
  try {
    const obj = jsonObject(await haiku(SCRAMBLE_SYSTEM, "Choose today's scramble words."));
    const arr = obj?.words;
    if (!Array.isArray(arr)) return [];
    const out: LiveScramble[] = [];
    for (const raw of arr) {
      const o = raw as Record<string, unknown>;
      const word = typeof o.word === "string" ? o.word.trim().toLowerCase() : "";
      const hint = typeof o.hint === "string" ? o.hint.trim() : "";
      // Guard the app's contract: letters only, and the hint must not give it away.
      if (!word || !hint || !/^[a-z]+$/.test(word) || hint.toLowerCase().includes(word)) continue;
      out.push({ word, hint, bands: parseBands(o.bands) });
    }
    return out;
  } catch {
    return [];
  }
}

async function generateRiddles(): Promise<LiveRiddle[]> {
  if (!process.env.ANTHROPIC_API_KEY) return [];
  try {
    const obj = jsonObject(await haiku(RIDDLE_SYSTEM, "Write today's riddles."));
    const arr = obj?.riddles;
    if (!Array.isArray(arr)) return [];
    const out: LiveRiddle[] = [];
    for (const raw of arr) {
      const o = raw as Record<string, unknown>;
      const question = typeof o.question === "string" ? o.question.trim() : "";
      const answer = typeof o.answer === "string" ? o.answer.trim() : "";
      if (!question || !answer) continue;
      out.push({ question, answer, bands: parseBands(o.bands) });
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

/** Prefetch today's live content bites for the modules present in a pool. */
export async function gatherDailyExtras(pool: ModuleId[]): Promise<DailyExtras | undefined> {
  const want = {
    jokes: pool.includes("joke"),
    facts: pool.includes("fact"),
    words: pool.includes("word"),
    spanish: pool.includes("spanish"),
    scramble: pool.includes("scramble"),
    riddles: pool.includes("riddle"),
  };
  if (!Object.values(want).some(Boolean)) return undefined;

  const [jokes, facts, words, spanish, scramble, riddles] = await Promise.all([
    want.jokes ? getDaily("jokes", generateJokes) : Promise.resolve<LiveJoke[]>([]),
    want.facts ? getDaily("facts", generateFacts) : Promise.resolve<LiveFact[]>([]),
    want.words ? getDaily("words", generateWords) : Promise.resolve<LiveWord[]>([]),
    want.spanish ? getDaily("spanish", generateSpanish) : Promise.resolve<LiveSpanish[]>([]),
    want.scramble ? getDaily("scramble", generateScramble) : Promise.resolve<LiveScramble[]>([]),
    want.riddles ? getDaily("riddles", generateRiddles) : Promise.resolve<LiveRiddle[]>([]),
  ]);

  const out: DailyExtras = {};
  if (jokes.length) out.jokes = jokes;
  if (facts.length) out.facts = facts;
  if (words.length) out.words = words;
  if (spanish.length) out.spanish = spanish;
  if (scramble.length) out.scramble = scramble;
  if (riddles.length) out.riddles = riddles;
  return Object.keys(out).length ? out : undefined;
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

/** Band-appropriate pick from any live pool with a `bands` field (null → static). */
function pickLive<T extends { bands: AgeBand[] }>(
  pool: T[],
  band: AgeBand,
  rng: () => number,
): T | null {
  const fit = pool.filter((x) => x.bands.includes(band));
  const src = fit.length ? fit : pool;
  if (!src.length) return null;
  return shuffle(rng, src)[0];
}

export function pickLiveWord(pool: LiveWord[], band: AgeBand, rng: () => number): WordItem | null {
  const w = pickLive(pool, band, rng);
  return w ? { word: w.word, phonetic: w.phonetic, pos: w.pos, definition: w.definition, example: w.example, tryThis: w.tryThis } : null;
}

export function pickLiveSpanish(pool: LiveSpanish[], band: AgeBand, rng: () => number): SpanishItem | null {
  const s = pickLive(pool, band, rng);
  return s ? { spanish: s.spanish, phonetic: s.phonetic, english: s.english, example: s.example } : null;
}

export function pickLiveScramble(pool: LiveScramble[], band: AgeBand, rng: () => number): ScrambleItem | null {
  const s = pickLive(pool, band, rng);
  return s ? { word: s.word, hint: s.hint } : null;
}

export function pickLiveRiddle(pool: LiveRiddle[], band: AgeBand, rng: () => number): RiddleItem | null {
  const r = pickLive(pool, band, rng);
  return r ? { question: r.question, answer: r.answer } : null;
}
