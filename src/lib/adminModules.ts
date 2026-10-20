import type { AgeBand, ModuleId } from "./types";
import { JOKES } from "./content/jokes";
import { FACTS } from "./content/facts";
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
    how: "Real “on this day” events from Wikipedia, filtered and rewritten kid-safe by AI, cached per date. The small dated bank below fills in only when the live feed has nothing usable.",
    bank: () => ({
      columns: ["Date", "Year", "Event"],
      rows: HISTORY.map((h) => ({ cells: [`${h.month}/${h.day}`, h.year, h.text], bands: h.bands })),
    }),
    recent: async () =>
      Promise.all(
        lastDays(7).map(async (date) => {
          const key = `history:${date.slice(5, 7)}-${date.slice(8, 10)}`;
          const p = await loadPayload<{ items?: { year: string; text: string; bands: AgeBand[] }[] }>(key);
          return {
            label: date,
            table: p
              ? { columns: ["Year", "Event"], rows: (p.items ?? []).map((i) => ({ cells: [i.year, i.text], bands: i.bands })) }
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
  sequence: { kind: "generated", how: "Procedural number pattern from 10 rule families (add/subtract, multiply, alternating, triangular, Fibonacci, squares, cubes, primes, double-and-add)." },
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
