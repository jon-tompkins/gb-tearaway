import type {
  AppSettings,
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
import { pickSpanish } from "./content/spanish";
import { pickWyr } from "./content/wyr";
import { pickPoem } from "./content/poems";
import { isNewsModule, pickNewsList } from "./content/news";
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

export interface GenerateOptions {
  nonce?: number;
  at?: Date;
  weather?: WeatherSnapshot;
  dateISO?: string;
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

  const paperWidthMm = paperSize === "letter" ? 216 : 58;
  const widthPx = paperSize === "letter" ? LETTER_WIDTH_PX : STRIP_WIDTH_PX;

  const sections: StripSection[] = [];

  sections.push({
    id: "header",
    moduleId: "header",
    title: "Masthead",
    kind: "header",
    lines: [
      "Tearaway Times",
      `For ${kid.name}`,
      `${weekday} · ${dateLabel}`,
      `Print window ${formatTime12(kid.printTime || settings.printTime)}`,
    ],
  });

  for (const moduleId of activeModules) {
    const meta = moduleById(moduleId);
    if (moduleId === "word") {
      const word = pickWord(kid.ageBand, rng);
      const lines = [
        `${word.word.toUpperCase()}  ·  ${word.phonetic}  ·  ${word.pos}`,
        word.definition,
        `Try it: “${word.example}”`,
      ];
      if (word.tryThis) lines.push(`Challenge: ${word.tryThis}`);
      sections.push({ id: `word-${word.word}`, moduleId, title: meta.name, kind: "text", lines });
      continue;
    }
    if (moduleId === "fact") {
      const fact = pickFact(kid.ageBand, rng);
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
      const hist = pickHistory(date, kid.ageBand, rng);
      const lead = hist.year ? `${hist.dateLabel}, ${hist.year}` : hist.dateLabel;
      sections.push({
        id: `hist-${hist.year || "x"}`,
        moduleId,
        title: meta.name,
        kind: "text",
        lines: [lead, hist.text],
      });
      continue;
    }
    if (moduleId === "maze") {
      const maze = generateMaze((seed ^ 0x4d41) >>> 0, kid.ageBand);
      const svg = mazeToSvg(maze, { showPath: false });
      sections.push({
        id: `maze-${maze.cols}x${maze.rows}`,
        moduleId,
        title: meta.name,
        kind: "maze",
        lines: [
          "Start at the filled dot. Finish at the open circle.",
          `${maze.cols}×${maze.rows} · age ${kid.ageBand}`,
        ],
        maze,
        svg,
      });
      continue;
    }
    if (moduleId === "sudoku") {
      const sudoku = generateSudoku((seed ^ 0x5355) >>> 0, kid.ageBand);
      const svg = sudokuToSvg(sudoku, { showSolution: false });
      sections.push({
        id: `sudoku-${sudoku.size}`,
        moduleId,
        title: sudoku.label,
        kind: "sudoku",
        lines: [
          "Fill every row, column, and box with each number once.",
          "Parent key is on screen only — not on the paper.",
        ],
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
        mockWeather(kid.ageBand, place);
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
      const todays = eventsForToday(kid.events, date);
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
      const joke = pickJoke(kid.ageBand, rng);
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
      const doodle = pickDoodle(kid.ageBand, rng);
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
      const riddle = pickRiddle(kid.ageBand, rng);
      sections.push({
        id: `riddle-${hashish(riddle.question)}`,
        moduleId,
        title: meta.name,
        kind: "text",
        lines: [
          riddle.question,
          "Think… then peek:",
          `Answer: ${riddle.answer}`,
        ],
      });
      continue;
    }
    if (moduleId === "spanish") {
      const word = pickSpanish(kid.ageBand, rng);
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
      const wyr = pickWyr(kid.ageBand, rng);
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
      const poem = pickPoem(kid.ageBand, rng);
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
      const wordfind = generateWordFind((seed ^ 0x5746) >>> 0, kid.ageBand);
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
      const dots = generateDots((seed ^ 0x444f) >>> 0, kid.ageBand);
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
      const items = pickNewsList(moduleId, kid.ageBand, rng, 4);
      sections.push({
        id: `${moduleId}-${hashish(items[0]?.headline ?? moduleId)}`,
        moduleId,
        title: meta.name,
        kind: "text",
        lines: [],
        news: items.map((i) => ({ headline: i.headline, blurb: i.blurb })),
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
    lines: ["— tear here —", closer, "tearaway · demo strip"],
  });

  // stamp each body section with its card footprint (header/footer stay unsized)
  let bi = 0;
  for (const sec of sections) {
    if (sec.kind !== "header" && sec.kind !== "footer") sec.size = bodySizes[bi++] ?? "full";
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
