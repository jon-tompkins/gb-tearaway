import Anthropic from "@anthropic-ai/sdk";
import type { AgeBand, ModuleId, WordItem } from "../types";
import type { SpanishItem } from "./spanish";
import type { ScrambleItem } from "./scramble";
import type { RiddleItem } from "./riddles";
import { loadPayload, savePayload } from "../persist";
import { shuffle } from "../rng";

/**
 * Fresh daily "content bites" — word of the day, Spanish word,
 * word scramble, riddle — generated kid-safe by Haiku and cached once per UTC
 * day (globally, like the news pipeline — one call per type per day for
 * everyone). Each DOES have a static fallback: if the model is unavailable the
 * caller uses the hand-written banks so a card always prints.
 */

const MODEL = "claude-haiku-4-5";
const BANDS: AgeBand[] = ["4-6", "7-9", "10-12"];

export type LiveWord = WordItem & { bands: AgeBand[] };
export type LiveSpanish = SpanishItem & { bands: AgeBand[] };
export type LiveScramble = ScrambleItem & { bands: AgeBand[] };
export type LiveRiddle = RiddleItem & { bands: AgeBand[] };

export interface DailyExtras {
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

async function generateWords(avoid: string[]): Promise<LiveWord[]> {
  if (!process.env.ANTHROPIC_API_KEY) return [];
  try {
    const obj = jsonObject(await haiku(WORD_SYSTEM, userMessage("Choose today's words of the day.", avoid)));
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

async function generateSpanish(avoid: string[]): Promise<LiveSpanish[]> {
  if (!process.env.ANTHROPIC_API_KEY) return [];
  try {
    const obj = jsonObject(await haiku(SPANISH_SYSTEM, userMessage("Choose today's Spanish words.", avoid)));
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

async function generateScramble(avoid: string[]): Promise<LiveScramble[]> {
  if (!process.env.ANTHROPIC_API_KEY) return [];
  try {
    const obj = jsonObject(await haiku(SCRAMBLE_SYSTEM, userMessage("Choose today's scramble words.", avoid)));
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

async function generateRiddles(avoid: string[]): Promise<LiveRiddle[]> {
  if (!process.env.ANTHROPIC_API_KEY) return [];
  try {
    const obj = jsonObject(await haiku(RIDDLE_SYSTEM, userMessage("Write today's riddles.", avoid)));
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

/** How many previous days of printed content a new batch must not repeat. */
const NO_REPEAT_DAYS = 21;

const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9áéíóúñü]+/g, " ").trim();

/**
 * The same prompt every morning gets nearly the same answers back (two weeks of
 * "fresh" jokes were ~38 distinct ones, which is why jokes and facts now come
 * from the static bank instead). So each request carries the date and
 * the recently printed items, and anything repeated anyway is dropped below.
 */
function userMessage(base: string, avoid: string[]): string {
  const head = `${base} Today is ${utcDate()}. Make this batch different from other days — vary the topics and avoid the most famous, over-used examples.`;
  if (!avoid.length) return head;
  return `${head}\n\nAlready printed recently — do NOT reuse or lightly reword any of these:\n${avoid
    .slice(0, 150)
    .map((a) => `- ${a}`)
    .join("\n")}`;
}

function priorDates(n: number): string[] {
  const out: string[] = [];
  const now = Date.now();
  for (let i = 1; i <= n; i++) out.push(new Date(now - i * 86_400_000).toISOString().slice(0, 10));
  return out;
}

async function getDaily<T>(
  key: string,
  gen: (avoid: string[]) => Promise<T[]>,
  keyOf: (item: T) => string,
): Promise<T[]> {
  const date = utcDate();
  const cacheKey = `${key}:${date}`;
  const cached = await loadPayload<{ date: string; items: T[] }>(cacheKey);
  if (cached?.date === date) return cached.items;

  const prior = await Promise.all(
    priorDates(NO_REPEAT_DAYS).map((d) => loadPayload<{ items?: T[] }>(`${key}:${d}`)),
  );
  const recent = prior.flatMap((p) => p?.items ?? []).map(keyOf);
  const seen = new Set(recent.map(norm));

  const generated = await gen(Array.from(new Set(recent)));
  const items: T[] = [];
  for (const item of generated) {
    const k = norm(keyOf(item));
    if (!k || seen.has(k)) continue; // repeated anyway → drop it
    seen.add(k);
    items.push(item);
  }
  // Cache even an empty result so a bad model day doesn't retry all day; the
  // caller simply falls back to the static bank when items is empty.
  await savePayload(cacheKey, { date, items });
  return items;
}

/** Prefetch today's live content bites for the modules present in a pool. */
export async function gatherDailyExtras(pool: ModuleId[]): Promise<DailyExtras | undefined> {
  const want = {
    words: pool.includes("word"),
    spanish: pool.includes("spanish"),
    scramble: pool.includes("scramble"),
    riddles: pool.includes("riddle"),
  };
  if (!Object.values(want).some(Boolean)) return undefined;

  const [words, spanish, scramble, riddles] = await Promise.all([
    want.words ? getDaily("words", generateWords, (w) => w.word) : Promise.resolve<LiveWord[]>([]),
    want.spanish ? getDaily("spanish", generateSpanish, (w) => w.spanish) : Promise.resolve<LiveSpanish[]>([]),
    want.scramble ? getDaily("scramble", generateScramble, (w) => w.word) : Promise.resolve<LiveScramble[]>([]),
    want.riddles ? getDaily("riddles", generateRiddles, (r) => r.question) : Promise.resolve<LiveRiddle[]>([]),
  ]);

  const out: DailyExtras = {};
  if (words.length) out.words = words;
  if (spanish.length) out.spanish = spanish;
  if (scramble.length) out.scramble = scramble;
  if (riddles.length) out.riddles = riddles;
  return Object.keys(out).length ? out : undefined;
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
