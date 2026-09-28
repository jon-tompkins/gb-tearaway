import type { ModuleId } from "./types";

/** Human-readable "how it works" + "what you can set" for the public modules page. */
export interface ModuleInfo {
  /** How the content is produced / where it comes from. */
  source: string;
  /** What the parent can configure. */
  config: string[];
  /** True if the answer is kept in the app / QR, not printed. */
  answerInApp?: boolean;
}

const DIAL = "Appropriateness dial (kindergarten → adult) — tune it per card.";

export const MODULE_INFO: Record<ModuleId, ModuleInfo> = {
  // Play / puzzles — generated
  maze: {
    source:
      "Generated fresh by a maze algorithm, seeded from the date + your kid's name — always new, never repeats, and reproducible.",
    config: [DIAL + " Higher = a bigger, harder maze."],
  },
  wordfind: {
    source: "Generated word-search built from an age-banded word list.",
    config: [DIAL + " Sets grid size, word count, and whether words go diagonal/backward."],
  },
  dots: {
    source: "Generated connect-the-dots with a silly caption.",
    config: [DIAL + " Sets how many dots."],
  },
  riddle: {
    source: "A curated, age-checked riddle bank.",
    config: [DIAL + " Picks the age band."],
    answerInApp: true,
  },
  sudoku: {
    source:
      "Procedurally generated, then dug so every grid has exactly one solution — a real sudoku, not a guessing game.",
    config: [DIAL + " Scales 4×4 → 6×6 → easy 9×9 and how many blanks."],
    answerInApp: true,
  },
  sequence: {
    source:
      "Fully procedural number pattern (arithmetic, geometric, triangular, Fibonacci, squares…). Infinite variety, no content bank.",
    config: [DIAL + " Picks the pattern pool and trickiness."],
    answerInApp: true,
  },
  battleship: {
    source:
      "Generated fleet placement with the no-touch rule, and a solver that guarantees exactly one solution before it ever prints.",
    config: [DIAL + " Scales the grid 6×6 → 9×9 and the fleet size."],
    answerInApp: true,
  },
  // Words & language — curated banks
  word: {
    source: "A curated 'word of the day' bank — a real word with pronunciation, part of speech, and a sentence.",
    config: [DIAL + " Picks the age band's vocabulary."],
  },
  poem: {
    source: "A curated short-poem bank — soft, silly, or thoughtful.",
    config: [DIAL + " Picks the age band.", "Card size sets how long a poem fits."],
  },
  joke: {
    source: "A curated, age-checked joke bank. One groaner a day, nothing mean.",
    config: [DIAL + " Picks the age band."],
  },
  spanish: {
    source: "A curated Spanish word-a-day bank with pronunciation and a sentence.",
    config: [DIAL + " Picks the age band."],
  },
  scramble: {
    source: "A curated word bank; the letters are shuffled and a hint is given.",
    config: [DIAL + " Picks difficulty."],
    answerInApp: true,
  },
  // Curious facts
  usstate: {
    source: "Real US state outlines + capital coordinates (public map data), drawn as a clean SVG.",
    config: [DIAL + " Easy names the state and stars the capital; harder shows just the outline."],
    answerInApp: true,
  },
  country_eu: {
    source: "Real country outlines + capitals (Natural Earth data), scoped to Europe.",
    config: [DIAL + " Easy names it and stars the capital; harder is outline-only."],
    answerInApp: true,
  },
  country_af: {
    source: "Real country outlines + capitals (Natural Earth data), scoped to Africa.",
    config: [DIAL + " Easy names it and stars the capital; harder is outline-only."],
    answerInApp: true,
  },
  country_asia_oce: {
    source: "Real country outlines + capitals (Natural Earth data), scoped to Asia & Oceania.",
    config: [DIAL + " Easy names it and stars the capital; harder is outline-only."],
    answerInApp: true,
  },
  country_americas: {
    source: "Real country outlines + capitals (Natural Earth data), scoped to the Americas.",
    config: [DIAL + " Easy names it and stars the capital; harder is outline-only."],
    answerInApp: true,
  },
  history: {
    source:
      "Real 'on this day' events from Wikipedia, filtered kid-safe by AI and cached per date — no made-up history.",
    config: [DIAL + " Picks the age band."],
  },
  fact: {
    source: "A curated fun-fact bank — one true thing worth knowing before cereal.",
    config: [DIAL + " Picks the age band."],
  },
  // Kid-friendly news — live RSS + AI kid-safe rewrite, no fabricated fallback
  news_world: {
    source:
      "Real headlines (BBC Science & Environment) rewritten kid-safe by AI and cached daily. If nothing is kid-safe today, the card simply doesn't print — never a made-up story.",
    config: ["No setup — always real and kid-safe."],
  },
  news_national: {
    source:
      "Real US good-news headlines (Good News Network) rewritten kid-safe by AI, cached daily. No fabricated fallback.",
    config: ["No setup — always real and kid-safe."],
  },
  news_city: {
    source:
      "Real local headlines for your town — a Google News search on your city, biased to wholesome topics and rewritten kid-safe.",
    config: ["Set your city in Settings (it uses your weather city)."],
  },
  news_tech: {
    source: "Real tech headlines (BBC Technology) rewritten kid-safe by AI, cached daily.",
    config: ["No setup — always real and kid-safe."],
  },
  news_gamer: {
    source:
      "Real gaming headlines across Nintendo, PlayStation, Xbox and PC — releases, updates, and esports results — rewritten kid-safe, dropping mature titles.",
    config: ["No setup — always real and kid-safe."],
  },
  // Today's world
  weather: {
    source: "A live forecast from Open-Meteo for your city — today's sky plus the week ahead. No API key needed.",
    config: ["Set the city / ZIP in Settings."],
  },
  stocks: {
    source: "⚠️ Demo prices only right now — a simple up/down check, not live market data yet.",
    config: ["Parent-picked tickers in Settings."],
  },
  sports: {
    source: "Live results from TheSportsDB — each favorite team's last result and next game, cached daily.",
    config: ["Add up to 3 favorite teams in Settings (use full names, e.g. Los Angeles Lakers)."],
  },
  calendar: {
    source: "Your family's day — pulled from a Google Calendar you connect, or events you type in.",
    config: ["Connect a Google Calendar, or add events by hand, in Settings."],
  },
  // Create
  doodle: {
    source: "A curated 30-second drawing-prompt bank.",
    config: [DIAL + " Picks the age band."],
  },
  wyr: {
    source: "A curated 'would you rather' bank — two silly choices to debate.",
    config: [DIAL + " Picks the age band."],
  },
};
