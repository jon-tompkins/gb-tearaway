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
import { pickFactForDay } from "./content/facts";
import { pickRecordForDay } from "./content/records";
import { pickTwisterForDay, twisterLines } from "./content/twisters";
import { pickAnimalForDay } from "./content/animals";
import { pickCryptogramForDay } from "./content/cryptograms";
import { generateCryptogram } from "./puzzles/cryptogram";
import { buildNumberCross } from "./puzzles/numbercross";
import { pickHistory } from "./content/history";
import { pickJokeForDay } from "./content/jokes";
import {
  pickLiveWord,
  pickLiveSpanish,
  pickLiveRiddle,
  type DailyExtras,
} from "./content/live-extras";
import { pickRiddle } from "./content/riddles";
import { pickScrambleForDay, scrambleWord } from "./content/scramble";
import { generateSequence } from "./puzzles/sequence";
import { pickSpanish } from "./content/spanish";
import { pickPoemForDay, poemFontPt, poemLines } from "./content/poems";
import { isNewsModule, newsListFromPool, type LiveNewsEntry, type NewsModuleId } from "./content/news";
import type { LiveHistoryEntry } from "./news/history-live";
import type { SportsTeamResult } from "./sports";
import { eventsForToday, formatEventLine } from "./content/stubs";
import { mockStocks } from "./stocks";
import { generateMaze, mazeToSvg } from "./puzzles/maze";
import { generateSudoku, sudokuToSvg } from "./puzzles/sudoku";
import { generateBattleship, battleshipToSvg, battleshipSolutionText } from "./puzzles/battleship";
import { buildCrossword, crosswordAnswerText, crosswordConfigForDifficulty } from "./puzzles/crossword";
import { crosswordThemeForDay } from "./content/crosswords";
import { generateStateQuiz } from "./puzzles/states";
import { generateCountryQuiz, type Continent } from "./puzzles/countries";
import { generateWordFind, wordFindToSvg } from "./puzzles/wordfind";
import { generateDots, dotsToSvg } from "./puzzles/dots";
import { moduleById } from "./modules";
import { buildPreviewHtml } from "./previewHtml";
import { ensureKidSlots, resolveActiveModules } from "./slots";
import { bandFromDifficulty, defaultDifficultyForBand, effectiveDifficulty } from "./difficulty";

export interface GenerateOptions {
  nonce?: number;
  at?: Date;
  weather?: WeatherSnapshot | null;
  dateISO?: string;
  /** Live calendar events (from the parent's selected Google calendar). */
  events?: CalendarEvent[];
  /** Today's real (kid-safe) news per feed; falls back to the static bank. */
  newsByFeed?: Partial<Record<NewsModuleId, LiveNewsEntry[]>>;
  /** Today's real (kid-safe) "on this day" events; falls back to the static bank. */
  historyLive?: LiveHistoryEntry[];
  /** Live favorite-team sports results (fetched by the route). */
  sports?: SportsTeamResult[];
  /** Today's fresh Haiku-generated jokes/facts; falls back to the static bank. */
  extras?: DailyExtras;
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
    const raw = perModule ?? s?.difficulty ?? ageDefaultDiff;
    return effectiveDifficulty(r.moduleId, raw);
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
      const word =
        (opts.extras?.words && pickLiveWord(opts.extras.words, band, rng)) || pickWord(band, rng);
      const lines = [
        `${word.word.toUpperCase()}  ·  ${word.phonetic}  ·  ${word.pos}`,
        word.definition,
      ];
      // A ½ card only fits the word + definition; larger cards add example + challenge.
      if (cardSize !== "half") {
        lines.push(`Try it: “${word.example}”`);
        if (word.tryThis) lines.push(`Challenge: ${word.tryThis}`);
      }
      sections.push({ id: `word-${word.word}`, moduleId, title: meta.name, kind: "text", lines });
      continue;
    }
    if (moduleId === "fact") {
      const fact = pickFactForDay(band, { dateISO: date, kid: firstName, nonce });
      sections.push({
        id: `fact-${hashish(fact.fact)}`,
        moduleId,
        title: meta.name,
        kind: "text",
        lines: [fact.fact, fact.extra],
      });
      continue;
    }
    if (moduleId === "records") {
      const rec = pickRecordForDay(band, { dateISO: date, kid: firstName, nonce });
      sections.push({
        id: `rec-${hashish(rec.record)}`,
        moduleId,
        title: meta.name,
        kind: "text",
        lines: [rec.category, rec.record, rec.extra],
      });
      continue;
    }
    if (moduleId === "animal") {
      const an = pickAnimalForDay(band, { dateISO: date, kid: firstName, nonce });
      sections.push({
        id: `animal-${hashish(an.name)}`,
        moduleId,
        title: meta.name,
        kind: "text",
        lines: an.lines,
        svg: an.svg,
      });
      continue;
    }
    if (moduleId === "tonguetwister") {
      const tw = pickTwisterForDay(band, { dateISO: date, kid: firstName, nonce });
      sections.push({
        id: `tt-${hashish(tw.text)}`,
        moduleId,
        title: meta.name,
        kind: "text",
        lines: twisterLines(tw, band),
      });
      continue;
    }
    if (moduleId === "cryptogram") {
      const msg = pickCryptogramForDay(band, { dateISO: date, kid: firstName, nonce });
      const cg = generateCryptogram(msg, band, rng);
      sections.push({
        id: `crypto-${hashish(msg)}`,
        moduleId,
        title: meta.name,
        kind: "text",
        lines: cg.lines,
        // Decoded message lives only in the app (Parent key) — never printed.
        answer: cg.answer,
      });
      continue;
    }
    if (moduleId === "history") {
      // Prefer real "on this day" events (Wikimedia → Sonnet, pre-built), gathered
      // by the route; fall back to the static bank if unavailable.
      const livePool = (opts.historyLive ?? []).filter(
        (h) => !h.bands.length || h.bands.includes(band),
      );
      let year: string;
      let text: string;
      let category: string | undefined;
      if (livePool.length) {
        const chosen = livePool[Math.floor(rng() * livePool.length) % livePool.length];
        year = chosen.year;
        text = chosen.text;
        category = chosen.category;
      } else {
        const hist = pickHistory(date, band, rng);
        year = hist.year;
        text = hist.text;
      }
      // Year only as the lead — the month/day is redundant (it's today). Entries
      // without a year drop the lead entirely rather than print the date.
      const lead = [year, category].filter(Boolean).join(" · ");
      const lines = lead ? [lead, text] : [text];
      sections.push({
        id: `hist-${year || "x"}`,
        moduleId,
        title: meta.name,
        kind: "text",
        lines,
      });
      continue;
    }
    if (moduleId === "maze") {
      // A Letter 1× card is wide and short, so stretching a tall maze into it
      // squashes the cells; print a square maze there instead.
      const square = paperSize === "letter" && cardSize === "full";
      const maze = generateMaze((seed ^ 0x4d41) >>> 0, band, difficulty, { square });
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
    if (moduleId === "battleship") {
      // Retry with fresh rng draws if a placement can't be made unique.
      let bs;
      for (let t = 0; t < 5 && !bs; t++) {
        try { bs = generateBattleship(rng, difficulty); } catch { /* retry */ }
      }
      if (bs) {
        sections.push({
          id: `battleship-${bs.n}-${bs.rows.join("")}`,
          moduleId,
          title: bs.label,
          kind: "battleship",
          lines: [],
          battleship: bs,
          svg: battleshipToSvg(bs, { showSolution: false }),
          // Solution shows only in the app (Parent key / QR) — never printed.
          answer: battleshipSolutionText(bs),
        });
      }
      continue;
    }
    if (moduleId === "crossword") {
      const cfg = crosswordConfigForDifficulty(difficulty);
      // Today's theme; if it can't fill the grid well, try a few others.
      let theme = crosswordThemeForDay(band, { dateISO: date, kid: firstName, nonce });
      let cw = buildCrossword(rng, theme.theme, theme.entries, cfg);
      for (let t = 0; t < 4 && (!cw || cw.words.length < cfg.target - 1); t++) {
        const alt = crosswordThemeForDay(band, { dateISO: date, kid: firstName, nonce: nonce + 1000 + t });
        const next = buildCrossword(rng, alt.theme, alt.entries, cfg);
        if (next && (!cw || next.words.length > cw.words.length)) {
          cw = next;
          theme = alt;
        }
      }
      if (cw) {
        sections.push({
          id: `crossword-${theme.theme}-${cw.cols}x${cw.rows}`,
          moduleId,
          title: `Crossword: ${theme.theme}`,
          kind: "crossword",
          lines: [],
          crossword: cw,
          // Answers show only in the app (Parent key / QR) — never printed.
          answer: crosswordAnswerText(cw),
        });
      }
      continue;
    }
    if (moduleId === "numbercross") {
      const nc = buildNumberCross(rng, band, cardSize === "double" ? "double" : "full");
      if (nc) {
        sections.push({
          id: `numbercross-${nc.cw.cols}x${nc.cw.rows}-${nc.cw.words[0]?.word ?? "x"}`,
          moduleId,
          title: meta.name,
          kind: "crossword",
          lines: [],
          crossword: nc.cw,
          // Answers show only in the app (Parent key / QR) — never printed.
          answer: crosswordAnswerText(nc.cw),
        });
      }
      continue;
    }
    if (moduleId === "usstate") {
      const q = generateStateQuiz(rng, difficulty);
      sections.push({
        id: `usstate-${q.name}`,
        moduleId,
        title: q.easy ? "State & Capital" : "Name the State",
        kind: "text",
        lines: q.easy
          ? [`${q.name}  ·  Capital: ${q.capital}  ★`]
          : ["What state is this? Name it and its capital."],
        svg: q.svg,
        locator: q.locatorSvg ?? undefined,
        // Easy shows the answer on the card; hard keeps it in the app (Parent key / QR).
        answer: q.easy ? undefined : q.answer,
      });
      continue;
    }
    if (
      moduleId === "country_eu" ||
      moduleId === "country_af" ||
      moduleId === "country_asia_oce" ||
      moduleId === "country_americas"
    ) {
      const cont: Continent =
        moduleId === "country_eu"
          ? "europe"
          : moduleId === "country_af"
            ? "africa"
            : moduleId === "country_asia_oce"
              ? "asia_oceania"
              : "americas";
      const q = generateCountryQuiz(rng, difficulty, cont);
      sections.push({
        id: `${moduleId}-${q.name}`,
        moduleId,
        title: q.easy ? "Country & Capital" : "Name the Country",
        kind: "text",
        lines: q.easy
          ? [`${q.name}  ·  Capital: ${q.capital}  ★`]
          : ["What country is this? Name it and its capital."],
        svg: q.svg,
        locator: q.locatorSvg ?? undefined,
        answer: q.easy ? undefined : q.answer,
      });
      continue;
    }
    if (moduleId === "weather") {
      const weather = opts.weather;
      // No fabricated forecast: if the live fetch failed (null/absent), print an
      // honest note rather than fake temps. The demo path still supplies mock.
      if (!weather) {
        sections.push({
          id: "weather",
          moduleId,
          title: meta.name,
          kind: "text",
          lines: ["Forecast unavailable this morning.", "The live weather service couldn’t be reached."],
        });
        continue;
      }
      const tempLine =
        weather.tempF != null
          ? `Now ${weather.tempF}°F${
              weather.highF != null && weather.lowF != null
                ? ` · High ${weather.highF}° · Low ${weather.lowF}°`
                : ""
            }`
          : weather.summary;
      const lines = [
        // The summary usually starts with the place already — don't print it twice.
        weather.summary.startsWith(weather.label) ? weather.summary : `${weather.label} · ${weather.summary}`,
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
    if (moduleId === "sports") {
      // Real results (fetched by the route). No teams / no data → honest note.
      const teams = opts.sports ?? [];
      if (teams.length) {
        const lines: string[] = [];
        for (const t of teams) {
          lines.push(`${t.team}${t.league ? ` · ${t.league}` : ""}`);
          if (t.last) lines.push(`Last: ${t.last}`);
          if (t.next) lines.push(`Next: ${t.next}`);
          if (!t.last && !t.next) lines.push("No recent games.");
        }
        sections.push({ id: `sports-${hashish(teams.map((t) => t.team).join())}`, moduleId, title: meta.name, kind: "text", lines });
      } else {
        sections.push({
          id: "sports-none",
          moduleId,
          title: meta.name,
          kind: "text",
          lines: ["Add a favorite team in Settings to see real scores here."],
        });
      }
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
      const joke = pickJokeForDay(band, { dateISO: date, kid: firstName, nonce });
      sections.push({
        id: `joke-${hashish(joke.setup)}`,
        moduleId,
        title: meta.name,
        kind: "text",
        lines: [joke.setup, joke.punchline],
      });
      continue;
    }
    if (moduleId === "riddle") {
      const riddle =
        (opts.extras?.riddles && pickLiveRiddle(opts.extras.riddles, band, rng)) || pickRiddle(band, rng);
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
      const item = pickScrambleForDay(band, { dateISO: date, kid: firstName, nonce });
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
      const word =
        (opts.extras?.spanish && pickLiveSpanish(opts.extras.spanish, band, rng)) || pickSpanish(band, rng);
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
    if (moduleId === "poem") {
      const poem = pickPoemForDay(band, { dateISO: date, kid: firstName, nonce }, cardSize);
      const lines = poemLines(poem);
      sections.push({
        id: `poem-${hashish(poem.title)}`,
        moduleId,
        title: meta.name,
        kind: "text",
        lines,
        fontPt: poemFontPt(lines, cardSize),
      });
      continue;
    }
    if (moduleId === "wordfind") {
      const wordfind = generateWordFind((seed ^ 0x5746) >>> 0, band, difficulty);
      const svg = wordFindToSvg(wordfind);
      sections.push({
        id: `wordfind-${wordfind.cols}x${wordfind.rows}`,
        moduleId,
        title: wordfind.theme ? `${meta.name}: ${wordfind.theme}` : meta.name,
        kind: "wordfind",
        // The print layout lists the words itself (beside or above the grid);
        // this line is the plain-text fallback.
        lines: [wordfind.words.join(" · ")],
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
      // Stories are two paragraphs now: 2x (double) = 2 stories, 1x = 1, and a
      // half card gets one story's first paragraph.
      const count = cardSize === "double" ? 2 : 1;
      // Real (kid-safe) headlines only — no fabricated fallback. If there are
      // none today, the card simply doesn't print (better to fail than fake it).
      const livePool = opts.newsByFeed?.[moduleId];
      const items = livePool && livePool.length ? newsListFromPool(livePool, band, rng, count) : [];
      if (!items.length) continue;
      sections.push({
        id: `${moduleId}-${hashish(items[0]?.headline ?? moduleId)}`,
        moduleId,
        title: meta.name,
        kind: "text",
        lines: [],
        news: items.map((i) => {
          const blurb = [i.blurb, i.wonder].filter(Boolean).join(" ");
          return {
            headline: i.headline,
            location: i.location,
            blurb: cardSize === "half" ? blurb.split(/\n\s*\n/)[0] : blurb,
            url: i.source?.url,
            outlet: i.source?.outlet,
          };
        }),
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
