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
    source: "A fresh riddle written each morning by an AI, age-checked (with a hand-curated backup bank of 100+).",
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
      "Fully procedural number pattern. Little kids count by 2s, 5s, and 10s; the middle levels add growing jumps, multiplying, squares, primes, and Fibonacci; the top levels use IQ-test rules like two woven sequences, jumps that are squares or primes, triple-then-subtract, and n³ − n. Harder levels show more numbers so there is exactly one sensible answer. Infinite variety, no content bank.",
    config: [DIAL + " Picks the rule families and how big the numbers get. From 13 up, it never prints a plain add-or-multiply pattern."],
    answerInApp: true,
  },
  crossword: {
    source:
      "Generated each day from a theme's word and clue list (hand-written per age band): words interlock in a real criss-cross grid, checked so every word crosses another and no stray letters touch.",
    config: [DIAL + " Sets how many words and how big the grid is."],
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
    source: "A real word chosen fresh each morning by an AI — with pronunciation, part of speech, and a sentence (hand-curated backup bank of 100+).",
    config: [DIAL + " Picks the age band's vocabulary."],
  },
  poem: {
    source: "Real public-domain poems (text taken verbatim from PoetryDB and Project Gutenberg), sized to fit the card. One a day per kid, alternating poets, no repeats until the bank is used.",
    config: [DIAL + " Picks the age band.", "Card size sets how long a poem fits."],
  },
  joke: {
    source:
      "A hand-picked bank of 500+ clean, age-checked jokes. Each kid works through it one a day in their own order, so nothing repeats until the whole bank is used.",
    config: [DIAL + " Picks the age band."],
  },
  spanish: {
    source: "A Spanish word chosen fresh each morning by an AI, with pronunciation and a sentence (hand-curated backup bank of 100+).",
    config: [DIAL + " Picks the age band."],
  },
  scramble: {
    source: "A word chosen fresh each morning by an AI; the letters are shuffled and a hint is given (hand-curated backup bank of 100+).",
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
      "Real 'on this day' events from Wikipedia — inventions, science, space, sports, famous battles, arts and births — picked and written for kids by AI, cached per date. No made-up history.",
    config: [DIAL + " Picks the age band."],
  },
  records: {
    source:
      "A bank of 250+ real, current world records — animals, space, weather, sports, buildings, giant food and human feats. Disputed or fast-changing records are left out. Each kid works through it one a day in their own order.",
    config: [DIAL + " Picks the age band."],
  },
  fact: {
    source:
      "A bank of 570+ true fun facts, written to avoid popular myths. Each kid works through it one a day in their own order, so nothing repeats until the whole bank is used.",
    config: [DIAL + " Picks the age band."],
  },
  // Kid-friendly news — live RSS + AI kid-safe rewrite, no fabricated fallback
  news_world: {
    source:
      "Real headlines from around the world (Good News Network, Mongabay, Science News Explores, Smithsonian, NASA) picked for interest, then written up kid-safe by AI from the full article each morning. If nothing is kid-safe today, the card simply doesn't print — never a made-up story.",
    config: ["Appropriateness starts at 5 — news is written for readers about 7 and up."],
  },
  news_national: {
    source:
      "Real US good-news headlines (Good News Network) rewritten kid-safe by AI, cached daily. No fabricated fallback.",
    config: ["Appropriateness starts at 5 — news is written for readers about 7 and up."],
  },
  news_city: {
    source:
      "Real local headlines for your town — a Google News search on your city, biased to wholesome topics and rewritten kid-safe.",
    config: ["Set your city in Settings (it uses your weather city)."],
  },
  news_tech: {
    source: "Real tech headlines (Science News Explores, Popular Science, IEEE Spectrum, ScienceDaily, New Atlas) — inventions, robots and gadgets — picked for interest, written up kid-safe from the full article, and fact-checked.",
    config: ["Appropriateness starts at 5 — news is written for readers about 7 and up."],
  },
  news_gamer: {
    source:
      "Real gaming headlines across Nintendo, PlayStation, Xbox and PC — releases, updates, and esports results — rewritten kid-safe, dropping mature titles.",
    config: ["Appropriateness starts at 5 — news is written for readers about 7 and up."],
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
};
