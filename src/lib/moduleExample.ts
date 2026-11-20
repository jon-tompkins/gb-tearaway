import type { ModuleId, AgeBand } from "./types";
import { mulberry32 } from "./rng";
import { generateMaze, mazeToSvg } from "./puzzles/maze";
import { generateSudoku, sudokuToSvg } from "./puzzles/sudoku";
import { generateWordFind, wordFindToSvg } from "./puzzles/wordfind";
import { generateDots, dotsToSvg } from "./puzzles/dots";
import { generateColorByNumber, colorByNumberToSvg } from "./puzzles/colorbynumber";
import { generateSequence } from "./puzzles/sequence";
import { generateBattleship, battleshipToSvg } from "./puzzles/battleship";
import { buildCrossword, crosswordToSvg, crosswordConfigForDifficulty } from "./puzzles/crossword";
import { CROSSWORD_THEMES } from "./content/crosswords";
import { generateStateQuiz } from "./puzzles/states";
import { generateCountryQuiz, type Continent } from "./puzzles/countries";
import { pickWord } from "./content/words";
import { pickFact } from "./content/facts";
import { pickRecord } from "./content/records";
import { pickTwister, twisterLines } from "./content/twisters";
import { generateLogicGrid } from "./puzzles/logicgrid";
import { pickAnimal } from "./content/animals";
import { pickPlane } from "./content/planes";
import { pickDino } from "./content/dinosaurs";
import { pickCryptogram } from "./content/cryptograms";
import { generateCryptogram } from "./puzzles/cryptogram";
import { buildNumberCross } from "./puzzles/numbercross";
import { pickJoke } from "./content/jokes";
import { pickQuote } from "./content/quotes";
import { pickRiddle } from "./content/riddles";
import { pickSpanish } from "./content/spanish";
import { pickPoem, poemLines } from "./content/poems";
import { pickScramble, scrambleWord } from "./content/scramble";
import { pickHistory } from "./content/history";

export interface ModuleExample {
  /** Pre-rendered SVG figure (puzzles / maps). */
  svg?: string;
  /** Geography: locator map shown beside the outline. */
  locator?: string;
  /** Text lines, exactly as they'd print. */
  text?: string[];
  /** A note shown under the example (e.g. the in-app answer, or "demo"). */
  note?: string;
}

const BAND: AgeBand = "7-9";
const DIFF = 8;

/** Gentle sample stories for the public module tiles. Not live headlines. */
const SHOWCASE_NEWS: Record<
  "news_world" | "news_national" | "news_city" | "news_tech" | "news_gamer",
  { headline: string; blurb: string }
> = {
  news_world: {
    headline: "Penguins take turns staying warm",
    blurb:
      "Emperor penguins huddle when the wind is cold. Birds in the middle get cozy, then they shuffle so friends on the edge get a turn.",
  },
  news_national: {
    headline: "Borrow a telescope like a book",
    blurb:
      "Some libraries let kids check out a telescope the way they check out a story. On a clear night, the Moon’s craters show up from the backyard.",
  },
  news_city: {
    headline: "The park has a new swing set",
    blurb:
      "A shady bench sits nearby, and there is room for a picnic under the trees. Families can bring a snack and stay for a story.",
  },
  news_tech: {
    headline: "Rovers still send pictures from Mars",
    blurb:
      "Small robots drive across Mars, stop to study a rock, and send photos home. They roll about as fast as a person walks.",
  },
  news_gamer: {
    headline: "A garden game with no losers",
    blurb:
      "You plant seeds, trade flowers with friends, and design a path. There is no timer, and nobody has to lose. Save the garden for after breakfast.",
  },
};

/** A representative example of a module's output (deterministic, seeded). */
export function moduleExample(id: ModuleId): ModuleExample {
  const rng = mulberry32(42);
  switch (id) {
    case "maze":
      return { svg: mazeToSvg(generateMaze(42, BAND, DIFF), { showPath: false }) };
    case "sudoku":
      return { svg: sudokuToSvg(generateSudoku(42, BAND, DIFF)) };
    case "wordfind":
      return { svg: wordFindToSvg(generateWordFind(42, BAND, DIFF)) };
    case "colorbynumber":
      return { svg: colorByNumberToSvg(generateColorByNumber(42, BAND)) };
    case "dots":
      return { svg: dotsToSvg(generateDots(42, BAND)) };
    case "crossword": {
      const t = CROSSWORD_THEMES.find((x) => x.bands.includes(BAND)) ?? CROSSWORD_THEMES[0];
      const cw = buildCrossword(mulberry32(11), t.theme, t.entries, crosswordConfigForDifficulty(DIFF));
      if (!cw) return { text: ["(example unavailable)"] };
      const clues = (d: "across" | "down") => cw.words.filter((w) => w.dir === d).map((w) => `${w.num}. ${w.clue}`);
      return {
        svg: crosswordToSvg(cw),
        text: [`Theme: ${t.theme}`, "Across:", ...clues("across"), "Down:", ...clues("down")],
        note: "Answers (scan the QR code on the page): " + cw.words.map((w) => `${w.num}${w.dir === "across" ? "A" : "D"} ${w.word}`).join(", "),
      };
    }
    case "battleship":
      return { svg: battleshipToSvg(generateBattleship(mulberry32(7), DIFF)) };
    case "sequence": {
      const p = generateSequence(rng, DIFF);
      return {
        text: [`${p.terms.join(",  ")},  __`, "What number comes next?"],
        note: `Answer (scan the QR code on the page): ${p.answer} — ${p.ruleLabel}`,
      };
    }
    case "usstate": {
      const q = generateStateQuiz(mulberry32(3), 4);
      return { svg: q.svg, locator: q.locatorSvg ?? undefined, text: [`${q.name}  ·  Capital: ${q.capital}  ★`] };
    }
    case "country_all":
    case "country_eu":
    case "country_af":
    case "country_asia_oce":
    case "country_americas": {
      const cont: Continent | "all" =
        id === "country_all"
          ? "all"
          : id === "country_eu"
          ? "europe"
          : id === "country_af"
            ? "africa"
            : id === "country_asia_oce"
              ? "asia_oceania"
              : "americas";
      const q = generateCountryQuiz(mulberry32(5), 4, cont);
      return { svg: q.svg, locator: q.locatorSvg ?? undefined, text: [`${q.name}  ·  Capital: ${q.capital}  ★`] };
    }
    case "word": {
      const w = pickWord(BAND, rng);
      return { text: [`${w.word.toUpperCase()}  ·  ${w.phonetic}  ·  ${w.pos}`, w.definition, `Try it: “${w.example}”`] };
    }
    case "fact": {
      const f = pickFact(BAND, rng);
      return { text: [f.fact, f.extra], note: "One a day from the bank — this is a sample." };
    }
    case "numbercross": {
      const nc = buildNumberCross(mulberry32(5), BAND, "full");
      if (!nc) return { text: ["Number Cross"] };
      return { text: [], svg: crosswordToSvg(nc.cw), note: "Each clue's answer is a number; crossing squares share a digit." };
    }
    case "cryptogram": {
      const cg = generateCryptogram(pickCryptogram(BAND, rng), BAND, rng);
      return { text: cg.lines, note: `Answer (scan the QR code on the page): ${cg.answer}` };
    }
    case "logicgrid": {
      const lg = generateLogicGrid(BAND, rng);
      return { text: lg.lines, svg: lg.svg, note: `Answer (scan the QR code on the page): ${lg.answer}` };
    }
    case "animal": {
      const a = pickAnimal(BAND, rng);
      return { text: a.lines, svg: a.svg, note: "One a day from the bank — this is a sample." };
    }
    case "dinosaurs": {
      const a = pickDino(BAND, rng);
      return { text: a.lines, svg: a.svg, note: "One a day from the bank — this is a sample." };
    }
    case "planes": {
      const a = pickPlane(BAND, rng);
      return { text: a.lines, svg: a.svg, note: "One a day from the bank — this is a sample." };
    }
    case "tonguetwister": {
      return { text: twisterLines(pickTwister(BAND, rng), BAND), note: "One a day from the bank — this is a sample." };
    }
    case "records": {
      const r = pickRecord(BAND, rng);
      return { text: [r.category, r.record, r.extra], note: "One a day from the bank — this is a sample." };
    }
    case "quote": {
      const q = pickQuote(BAND, rng);
      return { text: [`“${q.quote}”`, `— ${q.author}, ${q.role}`, `(${q.source})`, q.meaning], note: "One a day from the bank — this is a sample." };
    }
    case "joke": {
      const j = pickJoke(BAND, rng);
      return { text: [j.setup, j.punchline], note: "One a day from the bank — this is a sample." };
    }
    case "riddle": {
      const r = pickRiddle(BAND, rng);
      return { text: [r.question, "Think first. The answer is not on this page."], note: `Answer (scan the QR code on the page): ${r.answer}` };
    }
    case "spanish": {
      const s = pickSpanish(BAND, rng);
      return { text: [`${s.spanish.toUpperCase()}  ·  ${s.phonetic}`, `Means: ${s.english}`, s.example] };
    }
    case "poem": {
      const p = pickPoem(BAND, rng, "full");
      return { text: poemLines(p) };
    }
    case "scramble": {
      const item = pickScramble(BAND, rng);
      const scrambled = scrambleWord(item.word, rng);
      return {
        text: [`Unscramble:  ${scrambled}`, `${item.word.length} letters`, `Hint: ${item.hint}`],
        note: `Answer (scan the QR code on the page): ${item.word.toUpperCase()}`,
      };
    }
    case "history": {
      const h = pickHistory("2026-07-20", BAND, rng);
      return { text: h.year ? [String(h.year), h.text] : [h.text] };
    }
    case "weather":
      return {
        text: [
          "Sample forecast for your city",
          "Partly cloudy, jacket weather",
          "Look up before you zip the backpack.",
        ],
        note: "A sample of the card. Live pages use the forecast for your city.",
      };
    case "stocks":
      return {
        text: [
          "Sample card — not a price quote",
          "Apple — up from yesterday",
          "Disney — down from yesterday",
          "Nike — about the same",
        ],
        note: "A sample of the card. Parents pick the companies. This preview does not show prices.",
      };
    case "sports":
      return {
        text: ["Arsenal · English Premier League", "Last: 2–1 vs Chelsea · Sep 6", "Next: vs Leeds United · Oct 10"],
        note: "Live results for your favorite teams.",
      };
    case "sportsnews":
      return {
        text: [
          "Fans cheer a home opener",
          "The home team won its first game of the season. Players waved, and the crowd waved back.",
        ],
        note: "Example only. Live daily: real recent headlines about your favorite team, summarized kid-safe. Injuries, betting and rumors are left out.",
      };
    case "calendar":
      return {
        text: ["9:00 AM · Soccer practice", "3:30 PM · Library trip"],
        note: "From your connected Google Calendar (or events you add).",
      };
    case "news_world":
    case "news_national":
    case "news_city":
    case "news_tech":
    case "news_gamer": {
      const story = SHOWCASE_NEWS[id];
      return {
        text: [story.headline, story.blurb],
        note: "A sample story. A live page uses a real, kid-safe article when one is ready that day.",
      };
    }
  }
}
