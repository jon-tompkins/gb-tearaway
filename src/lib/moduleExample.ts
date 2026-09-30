import type { ModuleId, AgeBand } from "./types";
import { mulberry32 } from "./rng";
import { generateMaze, mazeToSvg } from "./puzzles/maze";
import { generateSudoku, sudokuToSvg } from "./puzzles/sudoku";
import { generateWordFind, wordFindToSvg } from "./puzzles/wordfind";
import { generateDots, dotsToSvg } from "./puzzles/dots";
import { generateSequence } from "./puzzles/sequence";
import { generateBattleship, battleshipToSvg } from "./puzzles/battleship";
import { generateStateQuiz } from "./puzzles/states";
import { generateCountryQuiz, type Continent } from "./puzzles/countries";
import { pickWord } from "./content/words";
import { pickFact } from "./content/facts";
import { pickJoke } from "./content/jokes";
import { pickRiddle } from "./content/riddles";
import { pickDoodle } from "./content/doodles";
import { pickWyr } from "./content/wyr";
import { pickSpanish } from "./content/spanish";
import { pickPoem, poemLines } from "./content/poems";
import { pickScramble, scrambleWord } from "./content/scramble";
import { pickHistory } from "./content/history";
import { mockWeather } from "./weather";
import { mockStocks } from "./stocks";

export interface ModuleExample {
  /** Pre-rendered SVG figure (puzzles / maps). */
  svg?: string;
  /** Text lines, exactly as they'd print. */
  text?: string[];
  /** A note shown under the example (e.g. the in-app answer, or "demo"). */
  note?: string;
}

const BAND: AgeBand = "7-9";
const DIFF = 8;

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
    case "dots":
      return { svg: dotsToSvg(generateDots(42, BAND)) };
    case "battleship":
      return { svg: battleshipToSvg(generateBattleship(mulberry32(7), DIFF)) };
    case "sequence": {
      const p = generateSequence(rng, DIFF);
      return {
        text: [`${p.terms.join(",  ")},  __`, "What number comes next?"],
        note: `Answer (in the app): ${p.answer} — ${p.ruleLabel}`,
      };
    }
    case "usstate": {
      const q = generateStateQuiz(mulberry32(3), 4);
      return { svg: q.svg, text: [`${q.name}  ·  Capital: ${q.capital}  ★`] };
    }
    case "country_eu":
    case "country_af":
    case "country_asia_oce":
    case "country_americas": {
      const cont: Continent =
        id === "country_eu"
          ? "europe"
          : id === "country_af"
            ? "africa"
            : id === "country_asia_oce"
              ? "asia_oceania"
              : "americas";
      const q = generateCountryQuiz(mulberry32(5), 4, cont);
      return { svg: q.svg, text: [`${q.name}  ·  Capital: ${q.capital}  ★`] };
    }
    case "word": {
      const w = pickWord(BAND, rng);
      return { text: [`${w.word.toUpperCase()}  ·  ${w.phonetic}  ·  ${w.pos}`, w.definition, `Try it: “${w.example}”`] };
    }
    case "fact": {
      const f = pickFact(BAND, rng);
      return { text: [f.fact, f.extra], note: "Written fresh each morning, kid-safe — this is a sample." };
    }
    case "joke": {
      const j = pickJoke(BAND, rng);
      return { text: [j.setup, j.punchline], note: "Written fresh each morning, kid-safe — this is a sample." };
    }
    case "riddle": {
      const r = pickRiddle(BAND, rng);
      return { text: [r.question, "Think… then check the app."], note: `Answer (in the app): ${r.answer}` };
    }
    case "doodle": {
      const d = pickDoodle(BAND, rng);
      return { text: [d.prompt, d.tip] };
    }
    case "wyr": {
      const w = pickWyr(BAND, rng);
      return { text: [`A) ${w.a}`, `B) ${w.b}`, w.nudge] };
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
        note: `Answer (in the app): ${item.word.toUpperCase()}`,
      };
    }
    case "history": {
      const h = pickHistory("2026-07-20", BAND, rng);
      return { text: h.year ? [String(h.year), h.text] : [h.text] };
    }
    case "weather": {
      const w = mockWeather(BAND, "Brooklyn");
      return { text: [`${w.tempF ?? ""}°  ·  ${w.summary}`, w.tip], note: "Live from Open-Meteo for your city." };
    }
    case "stocks": {
      const s = mockStocks(["AAPL", "DIS", "NKE"], 42);
      return {
        text: s.map((x) => `${x.ticker}  $${x.price.toFixed(2)}  ${x.changePct >= 0 ? "▲" : "▼"}${Math.abs(x.changePct).toFixed(1)}%`),
        note: "Demo prices — not live market data yet.",
      };
    }
    case "sports":
      return {
        text: ["Arsenal · English Premier League", "Last: 2–1 vs Chelsea · Sep 6", "Next: vs Leeds United · Oct 10"],
        note: "Live results for your favorite teams.",
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
    case "news_gamer":
      return {
        text: [
          "(A real, kid-safe headline for today)",
          "A short, factual, age-appropriate blurb — rewritten from a real news story.",
        ],
        note: "Live daily. Real headlines only — if nothing is kid-safe today, the card doesn't print.",
      };
  }
}
