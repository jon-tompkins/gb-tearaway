import type { AgeBand, ModuleId } from "./types";
import { JOKES } from "./content/jokes";
import { QUOTES } from "./content/quotes";
import { FACTS } from "./content/facts";
import { RECORDS } from "./content/records";
import { TWISTERS } from "./content/twisters";
import { ANIMALS } from "./content/animals";
import { PLANES } from "./content/planes";
import { CRYPTOGRAMS } from "./content/bank/cryptograms";
import { WORDS } from "./content/words";
import { WORDS as SPANISH } from "./content/spanish";
import { SCRAMBLES } from "./content/scramble";
import { RIDDLES } from "./content/riddles";
import { POEMS } from "./content/poems";
import { HISTORY } from "./content/history";
import { WORDFIND_THEMES } from "./puzzles/wordfind";
import { US_STATES } from "./puzzles/states-data";
import { COUNTRIES } from "./puzzles/countries-data";
import { CROSSWORD_THEMES } from "./content/crosswords";
import { NEWS_FEEDS } from "./news/sources";
import { loadPayload, listUserStates } from "./persist";
import { ensureKidSlots, flattenSlotModules } from "./slots";

export const AGE_BANDS: AgeBand[] = ["4-6", "7-9", "10-12"];

export type SourceKind = "bank" | "live" | "live+bank" | "generated" | "dataset" | "mock";

export const SOURCE_LABEL: Record<SourceKind, string> = {
  bank: "Static bank",
  live: "Live (daily)",
  "live+bank": "Live + backup bank",
  generated: "Generated",
  dataset: "Built-in dataset",
  mock: "Demo data",
};

export interface Table {
  columns: string[];
  rows: { cells: string[]; bands?: AgeBand[] }[];
}

/** One day's cached output for a live module. */
export interface CachedDay {
  label: string;
  table: Table | null;
}

export interface AdminModule {
  kind: SourceKind;
  /** How this module gets its content, in a sentence or two. */
  how: string;
  /** The built-in bank or dataset, if any. */
  bank?: () => Table;
  /** Recent cached daily output, if the module has a live pipeline. */
  recent?: () => Promise<CachedDay[]>;
}

const joinBands = (b: AgeBand[]) => b.join(", ");

function lastDays(n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10));
  return out;
}

type Bandish = { bands?: AgeBand[] };

/** Cached `<prefix>:<date>` payloads ({ items }) for the last `days` UTC days. */
function cachedDays<T extends Bandish>(
  keyFor: (date: string) => string,
  columns: string[],
  toCells: (item: T) => string[],
  days = 7,
): () => Promise<CachedDay[]> {
  return async () =>
    Promise.all(
      lastDays(days).map(async (date) => {
        const p = await loadPayload<{ items?: T[] }>(keyFor(date));
        if (!p) return { label: date, table: null };
        return {
          label: date,
          table: { columns, rows: (p.items ?? []).map((i) => ({ cells: toCells(i), bands: i.bands })) },
        };
      }),
    );
}

type NewsItem = {
  headline: string;
  location: string;
  blurb: string;
  wonder: string;
  bands: AgeBand[];
  source?: { title: string; url?: string; outlet: string; fullText: boolean };
};
const newsColumns = ["Our headline", "Where", "Our story", "Original (source)", "Link"];
const newsCells = (i: NewsItem) => [
  i.headline,
  i.location,
  [i.blurb, i.wonder].filter(Boolean).join(" "),
  i.source
    ? `${i.source.outlet}: “${i.source.title}”${i.source.fullText ? "" : " (teaser only)"}`
    : "(not recorded)",
  i.source?.url ?? "",
];

type Dropped = { title: string; url?: string; reason: string };

/** Each news day: the printed stories, then any picked-but-rejected ones with the reason. */
function newsDays(keyFor: (date: string) => string, labelSuffix = ""): () => Promise<CachedDay[]> {
  return async () =>
    Promise.all(
      lastDays(7).map(async (date) => {
        const p = await loadPayload<{ items?: NewsItem[]; dropped?: Dropped[] }>(keyFor(date));
        if (!p) return { label: `${date}${labelSuffix}`, table: null };
        const rows: Table["rows"] = (p.items ?? []).map((i) => ({ cells: newsCells(i), bands: i.bands }));
        for (const d of p.dropped ?? [])
          rows.push({ cells: ["✗ not printed", "", d.reason, d.title, d.url ?? ""] });
        return { label: `${date}${labelSuffix}`, table: { columns: newsColumns, rows } };
      }),
    );
}

function newsModule(feed: ModuleId, sourceNote: string): AdminModule {
  return {
    kind: "live",
    how: `${sourceNote} Each morning the news job picks the few genuinely interesting kid-safe stories, reads the full articles, writes them up, then fact-checks each against its article — anything unsupported is dropped (shown as “not printed” with the reason). No backup bank: if nothing qualifies, the card doesn't print.`,
    recent: newsDays((d) => `news:${d}:${feed}`),
  };
}

function feedNames(feed: keyof typeof NEWS_FEEDS): string {
  const url = NEWS_FEEDS[feed]?.url;
  const urls = Array.isArray(url) ? url : url ? [url] : [];
  return urls.map((u) => new URL(u).hostname.replace(/^www\./, "")).join(", ");
}

export const ADMIN_MODULES: Record<ModuleId, AdminModule> = {
  // ---- Static banks ----
  quote: {
    kind: "bank",
    how: "Static bank. Each kid works through their age band's quotes one a day, in their own shuffled order, so nothing repeats until the band is used up.",
    bank: () => ({
      columns: ["Quote", "Author", "Meaning"],
      rows: QUOTES.map((q) => ({ cells: [q.quote, `${q.author} (${q.role}) — ${q.source}`, q.meaning], bands: q.bands })),
    }),
  },
  joke: {
    kind: "bank",
    how: "Static bank. Each kid works through their age band's jokes one a day, in their own shuffled order, so nothing repeats until the band is used up.",
    bank: () => ({
      columns: ["Setup", "Punchline"],
      rows: JOKES.map((j) => ({ cells: [j.setup, j.punchline], bands: j.bands })),
    }),
  },
  fact: {
    kind: "bank",
    how: "Static bank. Each kid works through their age band's facts one a day, in their own shuffled order, so nothing repeats until the band is used up.",
    bank: () => ({
      columns: ["Fact", "Extra"],
      rows: FACTS.map((f) => ({ cells: [f.fact, f.extra], bands: f.bands })),
    }),
  },
  numbercross: {
    kind: "generated",
    how: "A criss-cross of number answers with calculation clues (sums, times tables, doubles → squares, percents, perimeters). Reuses the crossword layout engine with digits encoded as letters; each clue has exactly one numeric answer. Answers show in the app only.",
  },
  cryptogram: {
    kind: "bank",
    how: "Bank of ~70 short messages, encoded fresh each day: number code (4–6), letter shift with one clue letter (7–9), random substitution cipher with two letters revealed (10–12). Decoded message shows in the app only.",
    bank: () => ({
      columns: ["Message"],
      rows: CRYPTOGRAMS.map((c) => ({ cells: [c.text], bands: c.bands })),
    }),
  },
  logicgrid: {
    kind: "generated",
    how: "Built fresh each day; a solver proves exactly one solution and prunes redundant clues. Answer in the app only.",
  },
  animal: {
    kind: "bank",
    how: "Static bank of ~55 animals with generated line art. Each kid works through it one a day in their own shuffled order.",
    bank: () => ({
      columns: ["Animal", "Lives", "Size", "Fun fact"],
      rows: ANIMALS.map((a) => ({ cells: [a.name, a.lives, a.size, a.fact], bands: a.bands })),
    }),
  },
  planes: {
    kind: "bank",
    how: "Static bank of ~26 military aircraft with generated top-down line art. Each kid works through it one a day in their own shuffled order.",
    bank: () => ({
      columns: ["Aircraft", "Job", "Country", "Length (m)", "Wingspan (m)", "Speed", "Fun fact"],
      rows: PLANES.map((p) => ({ cells: [p.name, p.job, p.country, String(p.lengthM), String(p.spanM), p.speed, p.fact], bands: p.bands })),
    }),
  },
  tonguetwister: {
    kind: "bank",
    how: "Static bank of ~125 twisters tagged by the sound they drill. Each kid works through their age band one a day, in their own shuffled order.",
    bank: () => ({
      columns: ["Sound", "Twister"],
      rows: TWISTERS.map((t) => ({ cells: [t.sound, t.text], bands: t.bands })),
    }),
  },
  records: {
    kind: "bank",
    how: "Static bank of verified records (nature + people). Each kid works through their age band one a day, in their own shuffled order. The category prints as a small lead line.",
    bank: () => ({
      columns: ["Category", "Record", "Extra"],
      rows: RECORDS.map((r) => ({ cells: [r.category, r.record, r.extra], bands: r.bands })),
    }),
  },
  poem: {
    kind: "bank",
    how: "Static bank of real public-domain poems, sized to fit the card.",
    bank: () => ({
      columns: ["Title", "Author", "Lines"],
      rows: POEMS.map((p) => ({ cells: [p.title, p.author, p.lines.join(" / ")], bands: p.bands })),
    }),
  },

  // ---- Live (daily AI) with a backup bank ----
  word: {
    kind: "live+bank",
    how: "Chosen fresh each morning by AI (never repeating the last 3 weeks); the bank below is the backup when the AI isn't available.",
    bank: () => ({
      columns: ["Word", "Say it", "Part", "Meaning", "Example"],
      rows: WORDS.map((w) => ({ cells: [w.word, w.phonetic, w.pos, w.definition, w.example], bands: w.bands })),
    }),
    recent: cachedDays<{ word: string; phonetic: string; pos: string; definition: string; bands: AgeBand[] }>(
      (d) => `words:${d}`,
      ["Word", "Say it", "Part", "Meaning"],
      (w) => [w.word, w.phonetic, w.pos, w.definition],
    ),
  },
  spanish: {
    kind: "live+bank",
    how: "Chosen fresh each morning by AI (never repeating the last 3 weeks); the bank below is the backup.",
    bank: () => ({
      columns: ["Spanish", "Say it", "English", "Example"],
      rows: SPANISH.map((s) => ({ cells: [s.spanish, s.phonetic, s.english, s.example], bands: s.bands })),
    }),
    recent: cachedDays<{ spanish: string; phonetic: string; english: string; bands: AgeBand[] }>(
      (d) => `spanish:${d}`,
      ["Spanish", "Say it", "English"],
      (s) => [s.spanish, s.phonetic, s.english],
    ),
  },
  scramble: {
    kind: "bank",
    how: "Static bank. Each kid works through their age band's words one a day, in their own shuffled order; the app shuffles the letters.",
    bank: () => ({
      columns: ["Word", "Hint"],
      rows: SCRAMBLES.map((s) => ({ cells: [s.word, s.hint], bands: s.bands })),
    }),
  },
  riddle: {
    kind: "live+bank",
    how: "Written fresh each morning by AI (never repeating the last 3 weeks); the bank below is the backup. Answers show in the app, never on paper.",
    bank: () => ({
      columns: ["Riddle", "Answer"],
      rows: RIDDLES.map((r) => ({ cells: [r.question, r.answer], bands: r.bands })),
    }),
    recent: cachedDays<{ question: string; answer: string; bands: AgeBand[] }>(
      (d) => `riddles:${d}`,
      ["Riddle", "Answer"],
      (r) => [r.question, r.answer],
    ),
  },
  history: {
    kind: "live+bank",
    how: "Real “on this day” events and births from Wikipedia; Sonnet picks 10-14 per date across inventions, science, space, sports, battles, arts, buildings, births and oddities (max 3 per category), written for kids. All 366 dates are pre-built by /api/cron/history. The small dated bank below fills in only when a date has nothing.",
    bank: () => ({
      columns: ["Date", "Year", "Event"],
      rows: HISTORY.map((h) => ({ cells: [`${h.month}/${h.day}`, h.year, h.text], bands: h.bands })),
    }),
    recent: async () =>
      Promise.all(
        lastDays(7).map(async (date) => {
          const key = `history2:${date.slice(5, 7)}-${date.slice(8, 10)}`;
          const p = await loadPayload<{ items?: { year: string; category?: string; text: string; bands: AgeBand[] }[] }>(key);
          return {
            label: date,
            table: p
              ? { columns: ["Year", "Category", "Event"], rows: (p.items ?? []).map((i) => ({ cells: [i.year, i.category ?? "", i.text], bands: i.bands })) }
              : null,
          };
        }),
      ),
  },

  // ---- Live news (no bank) ----
  news_world: newsModule("news_world", `Sources: ${feedNames("news_world")}.`),
  news_national: newsModule("news_national", `Source: ${feedNames("news_national")}.`),
  news_tech: newsModule("news_tech", `Source: ${feedNames("news_tech")}.`),
  news_gamer: newsModule("news_gamer", `Sources: ${feedNames("news_gamer")}.`),
  news_city: {
    kind: "live",
    how: "A Google News search on each dispatch's city, then the same pick → read → write news job. No backup bank.",
    recent: async () => {
      const cities = new Set<string>();
      for (const { state } of await listUserStates()) {
        const city = state.settings.weatherCity?.trim();
        if (city && state.kids.some((k) => flattenSlotModules(ensureKidSlots(k).slots).includes("news_city")))
          cities.add(city);
      }
      const out: CachedDay[] = [];
      for (const city of cities) {
        out.push(...(await newsDays((d) => `news:${d}:news_city:${city.toLowerCase()}`, ` · ${city}`)()));
      }
      return out;
    },
  },

  // ---- Live APIs, nothing stored ----
  weather: {
    kind: "live",
    how: "Live forecast from Open-Meteo for the dispatch's city/ZIP, fetched at print time. If it can't be reached, the card says the forecast is unavailable (demo temps only on the signed-out demo).",
  },
  sports: {
    kind: "live",
    how: "Live last result + next game for each favorite team from TheSportsDB, fetched at print time.",
  },
  sportsnews: {
    kind: "live",
    how: "Google News RSS search per favorite team (first 2, last 3 days) → keyword safety pre-filter → one Haiku 4.5 call per team picks ≤3 kid-safe items, summarized from the headline only. Cached per team per UTC day (empty results ≤1h); capped at ~12s at render time.",
  },
  calendar: {
    kind: "live",
    how: "Today's events from the parent's connected Google Calendar, or events typed in by hand.",
  },
  stocks: {
    kind: "mock",
    how: "Demo prices only (deterministic fake numbers) — not live market data yet.",
  },

  // ---- Generated puzzles ----
  maze: { kind: "generated", how: "Generated fresh by a maze algorithm from the date + kid's name. Infinite, never repeats." },
  sudoku: { kind: "generated", how: "Generated, then checked to have exactly one solution. 4×4 → 6×6 → 9×9 by appropriateness." },
  crossword: {
    kind: "generated",
    how: "Each day's grid is generated from one theme (no repeats until every theme for the age band is used). Themes, words and clues below.",
    bank: () => ({
      columns: ["Theme", "Words & clues"],
      rows: CROSSWORD_THEMES.map((t) => ({
        cells: [t.theme, t.entries.map((e) => `${e.word} — ${e.clue}`).join(" · ")],
        bands: t.bands,
      })),
    }),
  },
  battleship: { kind: "generated", how: "Random no-touch fleet + a solver that guarantees exactly one solution before it prints." },
  sequence: { kind: "generated", how: "Procedural number pattern, 10 tiers by dial: count-by → growing jumps/×/squares → primes/Fibonacci/cubes → woven sequences, square/prime/Fibonacci gaps, ×k±c, tribonacci, polynomials, disguised primes. 13+ rejects plain add/× patterns (scripts/verify-sequence.ts)." },
  colorbynumber: { kind: "generated", how: "Picks one hand-drawn pixel picture (8 so far, by age band) and prints it as a numbered grid with a color key." },
  dots: { kind: "generated", how: "Generated connect-the-dots shape with a caption." },
  wordfind: {
    kind: "generated",
    how: "The grid is generated fresh each day from one theme's word list (the theme prints as the heading). Themes below; the appropriateness dial sets grid size and how many words hide.",
    bank: () => ({
      columns: ["Theme", "Words"],
      rows: WORDFIND_THEMES.map((t) => ({ cells: [t.theme, `${t.words.length}: ${t.words.join(", ")}`], bands: t.bands })),
    }),
  },

  // ---- Datasets ----
  usstate: {
    kind: "dataset",
    how: "Built-in outlines + capitals for all 50 states (public map data).",
    bank: () => ({ columns: ["State", "Capital"], rows: US_STATES.map((s) => ({ cells: [s.name, s.capital] })) }),
  },
  country_eu: countryModule("europe"),
  country_af: countryModule("africa"),
  country_asia_oce: countryModule("asia_oceania"),
  country_americas: countryModule("americas"),
};

function countryModule(continent: (typeof COUNTRIES)[number]["continent"]): AdminModule {
  return {
    kind: "dataset",
    how: "Built-in country outlines + capitals (Natural Earth data).",
    bank: () => ({
      columns: ["Country", "Capital"],
      rows: COUNTRIES.filter((c) => c.continent === continent).map((c) => ({ cells: [c.name, c.capital] })),
    }),
  };
}

/** Bank size per age band (or total, for unbanded datasets). */
export function bankCounts(m: AdminModule): { total: number; perBand: Partial<Record<AgeBand, number>> } | null {
  if (!m.bank) return null;
  const rows = m.bank().rows;
  const perBand: Partial<Record<AgeBand, number>> = {};
  for (const band of AGE_BANDS) {
    const n = rows.filter((r) => r.bands?.includes(band)).length;
    if (n) perBand[band] = n;
  }
  return { total: rows.length, perBand };
}

export { joinBands };
