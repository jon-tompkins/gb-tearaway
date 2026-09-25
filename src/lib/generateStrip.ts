import type {
  AppSettings,
  CalendarEvent,
  KidProfile,
  PrintJob,
  StripSection,
  WeatherSnapshot,
} from "./types";
import { LETTER_WIDTH_PX, STRIP_DPI, STRIP_WIDTH_PX } from "./types";
import { dateISOInZone, formatStripDate, formatTime12 } from "./dates";
import { mulberry32, pick, stripSeed, uid } from "./rng";
import { pickWord } from "./content/words";
import { pickFact } from "./content/facts";
import { pickHistory } from "./content/history";
import { pickJoke } from "./content/jokes";
import { pickDoodle } from "./content/doodles";
import { pickRiddle } from "./content/riddles";
import { pickScramble, scrambleWord } from "./content/scramble";
import { generateSequence } from "./puzzles/sequence";
import { pickSpanish } from "./content/spanish";
import { pickWyr } from "./content/wyr";
import { pickPoem } from "./content/poems";
import { isNewsModule, newsListFromPool, pickNewsList, type LiveNewsEntry, type NewsModuleId } from "./content/news";
import { eventsForToday, formatEventLine } from "./content/stubs";
import { mockStocks } from "./stocks";
import { mockWeather } from "./weather";
import { generateMaze, mazeToSvg } from "./puzzles/maze";
import { generateSudoku, sudokuToSvg } from "./puzzles/sudoku";
import { generateWordFind, wordFindToSvg } from "./puzzles/wordfind";
import { generateDots, dotsToSvg } from "./puzzles/dots";
import { moduleById } from "./modules";
import { buildPreviewHtml } from "./previewHtml";
import { ensureKidSlots, resolveActiveModules } from "./slots";
import { bandFromDifficulty, clampDifficulty, defaultDifficultyForBand } from "./difficulty";

export interface GenerateOptions {
  nonce?: number;
  at?: Date;
  weather?: WeatherSnapshot;
  dateISO?: string;
  /** Live calendar events (from the parent's selected Google calendar). */
  events?: CalendarEvent[];
  /** Today's real (kid-safe) news per feed; falls back to the static bank. */
  newsByFeed?: Partial<Record<NewsModuleId, LiveNewsEntry[]>>;
}

/**
 * Build a PrintJob for a kid. Content is deterministic for date + first name + nonce.
 */
export function generateStrip(
  kid: KidProfile,
  settings: AppSettings,
  opts: GenerateOptions = {},
): PrintJob {
  const timezone = kid.timezone || settings.timezone;
  const at = opts.at ?? new Date();
  const date = opts.dateISO ?? dateISOInZone(timezone, at);
  const nonce = opts.nonce ?? 0;
  const firstName = kid.name.trim().split(/\s+/)[0] || "Kid";
  const seed = stripSeed(date, firstName, nonce);
  const rng = mulberry32(seed);
  const { weekday, dateLabel } = formatStripDate(date);

  const kidNorm = ensureKidSlots(kid);
  const paperSize = kidNorm.paperSize;
  const { moduleIds: activeModules, resolved } = resolveActiveModules(kidNorm.slots, {
    dateISO: date,
    kidFirstName: firstName,
    nonce,
  });
  // card footprint (half/full/double) per resolved body section, in order
  const slotSizeById = new Map(kidNorm.slots.map((s) => [s.id, s.size ?? "full"]));
  const bodySizes = resolved.map((r) => slotSizeById.get(r.slotId) ?? "full");
  // print column (Letter = 0|1) per resolved body section, in order
  const slotColById = new Map(kidNorm.slots.map((s) => [s.id, s.column === 1 ? 1 : 0]));
  const bodyCols = resolved.map((r) => slotColById.get(r.slotId) ?? 0);
  // per-module difficulty (1–20); falls back to a legacy per-card value, then
  // the age-band default. Keyed to the resolved (slot, module) pair.
  const ageDefaultDiff = defaultDifficultyForBand(kid.ageBand);
  const slotById = new Map(kidNorm.slots.map((s) => [s.id, s]));
  const bodyDiffs = resolved.map((r) => {
    const s = slotById.get(r.slotId);
    const perModule = s?.moduleDifficulty?.[r.moduleId];
    if (perModule != null) return clampDifficulty(perModule);
    if (s?.difficulty != null) return clampDifficulty(s.difficulty);
    return ageDefaultDiff;
  });

  const paperWidthMm = paperSize === "letter" ? 216 : 58;
  const widthPx = paperSize === "letter" ? LETTER_WIDTH_PX : STRIP_WIDTH_PX;

  const sections: StripSection[] = [];

  sections.push({
    id: "header",
    moduleId: "header",
    title: "Masthead",
    kind: "header",
    lines: [
      "Back of the Box",
      `For ${kid.name}`,
      `${weekday} · ${dateLabel}`,
      `Print window ${formatTime12(kid.printTime || settings.printTime)}`,
    ],
  });

  for (let bodyIdx = 0; bodyIdx < activeModules.length; bodyIdx++) {
    const moduleId = activeModules[bodyIdx];
    const cardSize = bodySizes[bodyIdx] ?? "full";
    const difficulty = bodyDiffs[bodyIdx] ?? ageDefaultDiff;
    // Content level for this card follows its own difficulty dial, not the kid's age.
    const band = bandFromDifficulty(difficulty);
    const meta = moduleById(moduleId);
    if (moduleId === "word") {
      const word = pickWord(band, rng);
      const lines = [
        `${word.word.toUpperCase()}  ·  ${word.phonetic}  ·  ${word.pos}`,
        word.definition,
        `Try it: “${word.example}”`,
      ];
      // A ½ card can't fit the extra challenge line — drop it there.
      if (word.tryThis && cardSize !== "half") lines.push(`Challenge: ${word.tryThis}`);
      sections.push({ id: `word-${word.word}`, moduleId, title: meta.name, kind: "text", lines });
      continue;
    }
    if (moduleId === "fact") {
      const fact = pickFact(band, rng);
      sections.push({
        id: `fact-${hashish(fact.fact)}`,
        moduleId,
        title: meta.name,
        kind: "text",
        lines: [fact.fact, fact.extra],
      });
      continue;
    }
    if (moduleId === "history") {
      const hist = pickHistory(date, band, rng);
      // Year only as the lead — the month/day is redundant (it's today). Entries
      // without a year drop the lead entirely rather than print the date.
      const lines = hist.year ? [String(hist.year), hist.text] : [hist.text];
      sections.push({
        id: `hist-${hist.year || "x"}`,
        moduleId,
        title: meta.name,
        kind: "text",
        lines,
      });
      continue;
    }
    if (moduleId === "maze") {
      const maze = generateMaze((seed ^ 0x4d41) >>> 0, band, difficulty);
      const svg = mazeToSvg(maze, { showPath: false });
      sections.push({
        id: `maze-${maze.cols}x${maze.rows}`,
        moduleId,
        title: meta.name,
        kind: "maze",
        lines: [],
        maze,
        svg,
      });
      continue;
    }
    if (moduleId === "sudoku") {
      const sudoku = generateSudoku((seed ^ 0x5355) >>> 0, band, difficulty);
      const svg = sudokuToSvg(sudoku, { showSolution: false });
      sections.push({
        id: `sudoku-${sudoku.size}`,
        moduleId,
        title: sudoku.label,
        kind: "sudoku",
        lines: [],
        sudoku,
        svg,
      });
      continue;
    }
    if (moduleId === "weather") {
      const place =
        settings.weatherCity || settings.weatherZip || "home";
      const weather =
        opts.weather ??
        mockWeather(band, place);
      const tempLine =
        weather.tempF != null
          ? `Now ${weather.tempF}°F${
              weather.highF != null && weather.lowF != null
                ? ` · High ${weather.highF}° · Low ${weather.lowF}°`
                : ""
            }`
          : weather.summary;
      const lines = [
        `${weather.label} · ${weather.summary}`,
        tempLine,
        weather.tip,
      ];
      if (weather.source === "mock") {
        lines.push("Demo forecast — set city/ZIP for Open-Meteo.");
      }
      sections.push({
        id: "weather",
        moduleId,
        title: meta.name,
        kind: "weather",
        lines,
        weather,
      });
      continue;
    }
    if (moduleId === "stocks") {
      const list = kid.watchlist.length > 0 ? kid.watchlist : ["AAPL", "DIS", "NKE"];
      const stocks = mockStocks(list.slice(0, 5), seed);
      const lines = stocks.map((s) => {
        const arrow = s.changePct >= 0 ? "▲" : "▼";
        const sign = s.changePct >= 0 ? "+" : "";
        return `${s.ticker}  $${s.price.toFixed(2)}  ${arrow}${sign}${s.changePct.toFixed(1)}%`;
      });
      lines.push("Demo prices — not live market data.");
      sections.push({ id: "stocks", moduleId, title: meta.name, kind: "stocks", lines, stocks });
      continue;
    }
    if (moduleId === "calendar") {
      const sourceEvents = opts.events ?? kid.events;
      const todays = eventsForToday(sourceEvents, date);
      const lines =
        todays.length > 0
          ? todays.map(formatEventLine)
          : ["Nothing on the list today. Enjoy the quiet."];
      sections.push({
        id: "calendar",
        moduleId,
        title: meta.name,
        kind: "calendar",
        lines,
        events: todays,
      });
      continue;
    }
    if (moduleId === "joke") {
      const joke = pickJoke(band, rng);
      sections.push({
        id: `joke-${hashish(joke.setup)}`,
        moduleId,
        title: meta.name,
        kind: "text",
        lines: [joke.setup, joke.punchline],
      });
      continue;
    }
    if (moduleId === "doodle") {
      const doodle = pickDoodle(band, rng);
      sections.push({
        id: `doodle-${hashish(doodle.prompt)}`,
        moduleId,
        title: meta.name,
        kind: "text",
        lines: [doodle.prompt, doodle.tip, "Draw in the margin or on the back."],
      });
      continue;
    }
    if (moduleId === "riddle") {
      const riddle = pickRiddle(band, rng);
      sections.push({
        id: `riddle-${hashish(riddle.question)}`,
        moduleId,
        title: meta.name,
        kind: "text",
        lines: [riddle.question, "Think… then check the app."],
        // Answer shows only in the app (Parent key) — never printed.
        answer: riddle.answer,
      });
      continue;
    }
    if (moduleId === "sequence") {
      const puz = generateSequence(rng, difficulty);
      sections.push({
        id: `sequence-${puz.terms.join("-")}`,
        moduleId,
        title: meta.name,
        kind: "text",
        lines: [`${puz.terms.join(",  ")},  __`, "What number comes next?"],
        // Answer + rule show only in the app (Parent key) — never printed.
        answer: `${puz.answer}   ·   ${puz.ruleLabel}`,
      });
      continue;
    }
    if (moduleId === "scramble") {
      const item = pickScramble(band, rng);
      const scrambled = scrambleWord(item.word, rng);
      sections.push({
        id: `scramble-${hashish(item.word)}`,
        moduleId,
        title: meta.name,
        kind: "text",
        lines: [
          `Unscramble:  ${scrambled}`,
          `${item.word.length} letters`,
          `Hint: ${item.hint}`,
        ],
        // Answer lives only in the app (Parent key) — never in the printed lines.
        answer: item.word.toUpperCase(),
      });
      continue;
    }
    if (moduleId === "spanish") {
      const word = pickSpanish(band, rng);
      sections.push({
        id: `spanish-${word.spanish}`,
        moduleId,
        title: meta.name,
        kind: "text",
        lines: [
          `${word.spanish.toUpperCase()}  ·  ${word.phonetic}`,
          `Means: ${word.english}`,
          word.example,
        ],
      });
      continue;
    }
    if (moduleId === "wyr") {
      const wyr = pickWyr(band, rng);
      sections.push({
        id: `wyr-${hashish(wyr.a + wyr.b)}`,
        moduleId,
        title: meta.name,
        kind: "text",
        lines: [`A) ${wyr.a}`, `B) ${wyr.b}`, wyr.nudge],
      });
      continue;
    }
    if (moduleId === "poem") {
      const poem = pickPoem(band, rng);
      sections.push({
        id: `poem-${hashish(poem.title)}`,
        moduleId,
        title: meta.name,
        kind: "text",
        lines: [poem.title, ...poem.lines],
      });
      continue;
    }
    if (moduleId === "wordfind") {
      const wordfind = generateWordFind((seed ^ 0x5746) >>> 0, band, difficulty);
      const svg = wordFindToSvg(wordfind);
      sections.push({
        id: `wordfind-${wordfind.cols}x${wordfind.rows}`,
        moduleId,
        title: meta.name,
        kind: "wordfind",
        lines: [
          `Find: ${wordfind.words.join(" · ")}`,
          `${wordfind.cols}×${wordfind.rows} · circle each word`,
        ],
        wordfind,
        svg,
      });
      continue;
    }
    if (moduleId === "dots") {
      const dots = generateDots((seed ^ 0x444f) >>> 0, band);
      const svg = dotsToSvg(dots);
      sections.push({
        id: `dots-${dots.points.length}`,
        moduleId,
        title: meta.name,
        kind: "dots",
        lines: [dots.caption, `Dots 1–${dots.points.length}. Pencil, then giggle.`],
        dots,
        svg,
      });
      continue;
    }
    if (isNewsModule(moduleId)) {
      // 2x (double) = 3 stories, 1x (full) = 2, half = 1 — bigger font, stretched
      // to fill the card, so 3 roomy stories beat 4 cramped ones.
      const count = cardSize === "double" ? 3 : cardSize === "half" ? 1 : 2;
      // Prefer today's real (kid-safe) headlines when available; else static bank.
      const livePool = opts.newsByFeed?.[moduleId];
      const items =
        livePool && livePool.length
          ? newsListFromPool(livePool, band, rng, count)
          : pickNewsList(moduleId, band, rng, count);
      sections.push({
        id: `${moduleId}-${hashish(items[0]?.headline ?? moduleId)}`,
        moduleId,
        title: meta.name,
        kind: "text",
        lines: [],
        news: items.map((i) => ({
          headline: i.headline,
          location: i.location,
          blurb: `${i.blurb} ${i.wonder}`,
        })),
      });
      continue;
    }
  }

  const closer = pick(rng, [
    "Tear carefully. Keep the word. Share the fact.",
    "Paper first. Screens later.",
    "See you tomorrow morning.",
    "Made for the fridge, not the feed.",
  ]);

  sections.push({
    id: "footer",
    moduleId: "footer",
    title: "Tear",
    kind: "footer",
    lines: ["— tear here —", closer, "back of the box"],
  });

  // stamp each body section with its card footprint + print column (header/footer stay unsized)
  let bi = 0;
  for (const sec of sections) {
    if (sec.kind !== "header" && sec.kind !== "footer") {
      sec.size = bodySizes[bi] ?? "full";
      sec.column = bodyCols[bi] ?? 0;
      bi++;
    }
  }

  const job: PrintJob = {
    id: uid("job"),
    createdAt: new Date().toISOString(),
    date,
    timezone,
    kidId: kid.id,
    kidName: kid.name,
    ageBand: kid.ageBand,
    modules: [...activeModules],
    paperSize,
    paperWidthMm: paperWidthMm as 58 | 80 | 216,
    dpi: STRIP_DPI,
    widthPx,
    sections,
    previewHtml: "",
    nonce,
    status: "preview",
    payload: { format: "preview" },
  };
  job.previewHtml = buildPreviewHtml(job);
  return job;
}

function hashish(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36).slice(0, 6);
}
