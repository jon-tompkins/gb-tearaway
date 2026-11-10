import type { AgeBand } from "./types";
import { mulberry32 } from "./rng";
import { generateMaze, mazeToSvg } from "./puzzles/maze";
import { generateWordFind, wordFindToSvg } from "./puzzles/wordfind";
import { generateColorByNumber, colorByNumberToSvg } from "./puzzles/colorbynumber";
import { generateDots, dotsToSvg } from "./puzzles/dots";
import { generateSudoku, sudokuToSvg } from "./puzzles/sudoku";
import { generateBattleship, battleshipToSvg } from "./puzzles/battleship";
import { buildCrossword, crosswordConfigForDifficulty, crosswordToSvg, type CrosswordData } from "./puzzles/crossword";
import { buildNumberCross } from "./puzzles/numbercross";
import { generateLogicGrid } from "./puzzles/logicgrid";
import { CROSSWORD_THEMES } from "./content/crosswords";
import { bandFromDifficulty } from "./difficulty";
import { qrSvg } from "./qr";

const SITE_URL = "https://www.backofthebox.xyz";
const SITE_LABEL = "backofthebox.xyz";

/** Every puzzle a booklet can hold, with its natural card size ("double" = 2× card, else a 1× card). */
export const PUZZLE_KINDS = [
  { id: "maze", label: "Mazes", big: true },
  { id: "wordfind", label: "Word finds", big: true },
  { id: "dots", label: "Connect the dots", big: true },
  { id: "colorbynumber", label: "Color by number", big: true },
  { id: "crossword", label: "Crosswords", big: true },
  { id: "sudoku", label: "Sudoku", big: false },
  { id: "battleship", label: "Battleship", big: false },
  { id: "logicgrid", label: "Logic grids", big: false },
  { id: "numbercross", label: "Number crosses", big: false },
] as const;

export type PuzzleKind = (typeof PUZZLE_KINDS)[number]["id"];
export const ALL_PUZZLE_KINDS: PuzzleKind[] = PUZZLE_KINDS.map((k) => k.id);
export type BookletKind = PuzzleKind | "mix";
/** full = natural density (2× cards one per sheet, 1× cards two per sheet); half = doubled up (two / four per sheet). */
export type BookletLayout = "full" | "half";

export interface BookletOptions {
  /** Puzzle types to include (sheets cycle through them). */
  kinds: PuzzleKind[];
  layout: BookletLayout;
  /** Number of puzzle sheets (answer-key sheets are extra). */
  pages: number;
  /** Difficulty 1–20. */
  difficulty: number;
  seed: number;
  /** Extra inner margin for a 3-hole punch / binder. */
  binder: boolean;
  /** Double-sided: the punched margin alternates left/right so holes line up on the back. */
  duplex: boolean;
  /** Add answer-key sheets at the back. */
  answers: boolean;
}

export const BOOKLET_LIMITS = { minPages: 1, maxPages: 60 };

/** Puzzles per sheet for a kind under a layout. */
export function perSheet(kind: PuzzleKind, layout: BookletLayout): 1 | 2 | 4 {
  const big = PUZZLE_KINDS.find((k) => k.id === kind)?.big;
  return ((big ? 1 : 2) * (layout === "half" ? 2 : 1)) as 1 | 2 | 4;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

interface Item {
  kind: PuzzleKind;
  html: string;
  /** Small answer-key picture/text, when the puzzle has one. */
  answerHtml?: string;
}

/** Fit an SVG inside its box without stretching. */
const fit = (svg: string) => svg.replace(' preserveAspectRatio="none"', "").replace(/ width="[\d.]+" height="[\d.]+"/, "");
const fig = (svg: string) => `<div class="fig">${fit(svg)}</div>`;

function crosswordHtml(cw: CrosswordData, n: 1 | 2 | 4, caption: string, showAnswers = false): string {
  const list = (dir: "across" | "down") =>
    cw.words
      .filter((w) => w.dir === dir)
      .map((w) => `<div><b>${w.num}</b> ${esc(w.clue)} <span class="len">(${w.word.length})</span></div>`)
      .join("");
  const clues = `<div class="cw-clues"><div><h4>Across</h4>${list("across")}</div><div><h4>Down</h4>${list("down")}</div></div>`;
  return `<div class="cw n${n}">${caption ? `<div class="cap">${esc(caption)}</div>` : ""}<div class="cwbody">${fig(crosswordToSvg(cw, { showAnswers }))}${showAnswers ? "" : clues}</div></div>`;
}

function buildItem(kind: PuzzleKind, seed: number, difficulty: number, n: 1 | 2 | 4): Item {
  const band: AgeBand = bandFromDifficulty(difficulty);
  switch (kind) {
    case "maze": {
      // Letter content area is about 7.1in × 9.9in; two-up cells are 7.1×4.8, four-up 3.4×4.8.
      const base = Math.max(8, Math.round((6 + difficulty * 1.2) * (n === 4 ? 0.75 : 1)));
      const dims = n === 2 ? { cols: Math.round(base * 1.45), rows: base } : { cols: base, rows: Math.round(base * 1.38) };
      const maze = generateMaze(seed, band, difficulty, { dims });
      return {
        kind,
        html: fig(mazeToSvg(maze, { showPath: false, maxWidth: 900 })),
        answerHtml: fig(mazeToSvg(maze, { showPath: true, maxWidth: 900 })),
      };
    }
    case "wordfind": {
      const wf = generateWordFind(seed, band, difficulty);
      const grid = fig(wordFindToSvg(wf, 900, { maxCell: 80 }));
      const words = `<div class="words">${wf.words.map((w) => `<span>${esc(w)}</span>`).join("")}</div>`;
      return {
        kind,
        html: `<div class="${n === 2 ? "wf-half" : "wf-full"} n${n}">${grid}${words}</div>`,
        answerHtml: fig(wordFindToSvg(wf, 900, { maxCell: 80, showAnswers: true })),
      };
    }
    case "dots":
      return { kind, html: fig(dotsToSvg(generateDots(seed, band))) };
    case "colorbynumber":
      return { kind, html: fig(colorByNumberToSvg(generateColorByNumber(seed, band), { maxWidth: 480 })) };
    case "sudoku": {
      const sd = generateSudoku(seed, band, difficulty);
      return { kind, html: fig(sudokuToSvg(sd)), answerHtml: fig(sudokuToSvg(sd, { showSolution: true })) };
    }
    case "battleship": {
      let bs;
      for (let t = 0; t < 8 && !bs; t++) {
        try {
          bs = generateBattleship(mulberry32((seed + t * 31) >>> 0), difficulty);
        } catch {
          /* retry with a different draw */
        }
      }
      if (!bs) throw new Error("battleship generation failed");
      return { kind, html: fig(battleshipToSvg(bs)), answerHtml: fig(battleshipToSvg(bs, { showSolution: true })) };
    }
    case "logicgrid": {
      const lg = generateLogicGrid(band, mulberry32(seed));
      return {
        kind,
        html: `<div class="lg n${n}">${fig(lg.svg)}<div class="lg-lines">${lg.lines.map((l) => `<p>${esc(l)}</p>`).join("")}</div></div>`,
        answerHtml: `<div class="key-txt">${esc(lg.answer)}</div>`,
      };
    }
    case "numbercross": {
      for (let t = 0; t < 12; t++) {
        const nc = buildNumberCross(mulberry32((seed + t * 17) >>> 0), band, "full");
        if (nc) return { kind, html: crosswordHtml(nc.cw, n, ""), answerHtml: crosswordHtml(nc.cw, n, "", true) };
      }
      throw new Error("number cross generation failed");
    }
    case "crossword": {
      const cfg = crosswordConfigForDifficulty(difficulty);
      const themes = CROSSWORD_THEMES.filter((t) => t.bands.includes(band));
      const pool = themes.length ? themes : CROSSWORD_THEMES;
      let best: { cw: CrosswordData; theme: string } | null = null;
      for (let t = 0; t < 6; t++) {
        const th = pool[(seed + t) % pool.length];
        const cw = buildCrossword(mulberry32((seed + t * 13) >>> 0), th.theme, th.entries, cfg);
        if (cw && (!best || cw.words.length > best.cw.words.length)) best = { cw, theme: th.theme };
        if (best && best.cw.words.length >= cfg.target - 1) break;
      }
      if (!best) throw new Error("crossword generation failed");
      return {
        kind,
        html: crosswordHtml(best.cw, n, `Theme: ${best.theme}`),
        answerHtml: crosswordHtml(best.cw, n, "", true),
      };
    }
  }
}

export function buildBookletHtml(opts: BookletOptions, extra: { autoPrint?: boolean } = {}): string {
  const pages = Math.max(BOOKLET_LIMITS.minPages, Math.min(BOOKLET_LIMITS.maxPages, Math.round(opts.pages)));
  const kinds = opts.kinds.length ? opts.kinds : ALL_PUZZLE_KINDS;

  const qr = qrSvg(SITE_URL);
  const hdr = `<header class="bk-hdr"><div class="bk-mast">Back of the Box</div><div class="bk-sub">Puzzle booklet</div></header>`;
  const ftr = `<footer class="bk-ftr"><div class="bk-brand">Back of the Box · ${SITE_LABEL}</div><div class="bk-qr">${qr}<span>Scan for<br>more pages</span></div></footer>`;
  const wrap = (cls: string, inner: string) => `<section class="sheet ${cls}">${hdr}<div class="body">${inner}</div>${ftr}</section>`;

  const sheets: string[] = [];
  const keyed: { item: Item; label: string }[] = [];
  let counter = 0;
  for (let s = 0; s < pages; s++) {
    const kind = kinds[s % kinds.length];
    const n = perSheet(kind, opts.layout);
    const cells: string[] = [];
    for (let j = 0; j < n; j++) {
      // Different seed per puzzle, stable for a given booklet seed.
      const it = buildItem(kind, (opts.seed + counter++ * 7919) >>> 0, opts.difficulty, n);
      cells.push(`<div class="cell ${kind}">${it.html}</div>`);
      if (it.answerHtml) keyed.push({ item: it, label: n === 1 ? `Page ${s + 1}` : `Page ${s + 1}${"abcd"[j]}` });
    }
    sheets.push(wrap(`n${n}`, cells.join("")));
  }

  if (opts.answers) {
    const perKey = 6;
    for (let k = 0; k < keyed.length; k += perKey) {
      const cells = keyed
        .slice(k, k + perKey)
        .map(({ item, label }) => `<div class="key-cell"><div class="key-n">${label}</div>${item.answerHtml}</div>`)
        .join("");
      sheets.push(wrap("key", `<div class="key-title">Answers</div><div class="key-grid">${cells}</div>`));
    }
  }

  // Binder margin: the punched edge gets 0.9in; with duplex it alternates sides.
  const inner = opts.binder ? 0.9 : 0.5;
  const css = `
@page { size: 8.5in 11in; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; color: #1c1915; font-family: ui-monospace, Menlo, monospace; }
.sheet { width: 8.5in; height: 11in; padding: 0.4in 0.5in 0.4in ${inner}in; page-break-after: always; break-after: page; display: flex; flex-direction: column; gap: 0.15in; overflow: hidden; }
.sheet > .body { flex: 1 1 0; min-height: 0; display: grid; gap: 0.3in; }
.sheet.n1 > .body { grid-template-rows: 1fr; }
.sheet.n2 > .body { grid-template-rows: 1fr 1fr; }
.sheet.n4 > .body { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 0.25in; }
.sheet.key > .body { display: flex; flex-direction: column; gap: 0.1in; }
.bk-hdr { text-align: center; border-bottom: 1.4px solid #000; padding-bottom: 0.06in; }
.bk-mast { font-family: Georgia, 'Times New Roman', serif; font-weight: 700; font-size: 18pt; line-height: 1; letter-spacing: -0.01em; }
.bk-sub { font-size: 7pt; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 0.04in; }
.bk-ftr { position: relative; border-top: 1px solid #000; padding-top: 0.08in; min-height: 0.5in; display: flex; align-items: center; justify-content: center; }
.bk-brand { font-family: Georgia, 'Times New Roman', serif; font-size: 9pt; font-weight: 700; }
.bk-qr { position: absolute; right: 0; top: 0.06in; display: flex; align-items: center; gap: 0.07in; line-height: 0; }
.bk-qr svg { width: 0.45in; height: 0.45in; }
.bk-qr span { font-size: 5.5pt; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; line-height: 1.15; text-align: right; }
.sheet:last-child { page-break-after: auto; break-after: auto; }
${opts.duplex ? `.sheet:nth-child(even) { padding: 0.4in ${inner}in 0.4in 0.5in; }` : ""}
.cell { min-height: 0; min-width: 0; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.fig { width: 100%; flex: 1 1 0; min-height: 0; display: flex; align-items: center; justify-content: center; }
.fig svg { max-width: 100%; max-height: 100%; width: 100%; height: 100%; }
.words { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.06in 0.25in; font-size: 13pt; font-weight: 700; letter-spacing: 0.04em; padding-top: 0.12in; }
.wf-full, .wf-half { width: 100%; height: 100%; display: flex; flex-direction: column; min-height: 0; }
.wf-half { flex-direction: row; align-items: stretch; gap: 0.25in; }
.wf-half .words { align-self: center; flex-direction: column; flex-wrap: nowrap; gap: 0.06in; width: 1.5in; padding: 0; font-size: 11pt; justify-content: center; }
.wf-half .fig { flex: 1 1 0; height: 100%; align-self: stretch; min-width: 0; }
.key-title { font-size: 16pt; font-weight: 700; text-align: center; }
.key-grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr 1fr; gap: 0.2in; min-height: 0; }
.key-cell { display: flex; flex-direction: column; min-height: 0; }
.key-n { font-size: 9pt; font-weight: 700; margin-bottom: 0.04in; }
.key-cell .fig { flex: 1 1 0; }
.words.n4, .n4 .words { font-size: 8.5pt; gap: 0.03in 0.12in; }
.wf-full.n4 .words { font-size: 8pt; }
.cw { width: 100%; height: 100%; display: flex; flex-direction: column; min-height: 0; }
.cw .cap { font-size: 9pt; font-weight: 700; text-align: center; margin-bottom: 0.05in; }
.cwbody { flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; gap: 0.1in; }
.cwbody .fig { flex: 3 1 0; }
.cw-clues { flex: 2 1 0; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 0.15in; font-size: 8.5pt; line-height: 1.25; overflow: hidden; }
.cw-clues h4 { margin: 0 0 0.03in; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.05em; }
.cw-clues .len { color: #555; }
.cw.n2 .cwbody { flex-direction: row; }
.cw.n2 .cwbody .fig { flex: 1 1 0; }
.cw.n2 .cw-clues { flex: 1 1 0; grid-template-columns: 1fr 1fr; font-size: 8pt; }
.cw.n4 .cw-clues { font-size: 6.5pt; gap: 0.08in; }
.cw.n4 .cw-clues h4 { font-size: 6.5pt; }
.lg { width: 100%; height: 100%; display: flex; flex-direction: column; gap: 0.1in; min-height: 0; }
.lg .fig { flex: 2 1 0; }
.lg-lines { flex: 1 1 0; min-height: 0; font-size: 9pt; line-height: 1.3; overflow: hidden; }
.lg-lines p { margin: 0 0 0.04in; }
.lg.n2 { flex-direction: row; align-items: center; }
.lg.n2 .fig, .lg.n2 .lg-lines { flex: 1 1 0; }
.lg.n4 .lg-lines { font-size: 7pt; }
.key-txt { font-size: 9pt; line-height: 1.3; }
@media print { body { zoom: 1 !important; } }
@media screen { body { background: #e9e4d8; } .sheet { background: #fff; margin: 0.2in auto; box-shadow: 0 2px 12px rgba(0,0,0,.18); } }
`;
  const script = extra.autoPrint
    ? `<script>window.addEventListener("load",function(){setTimeout(function(){window.print()},300)})</script>`
    : `<script>(function(){function fit(){var w=document.documentElement.clientWidth;document.body.style.zoom=Math.min(1,(w-24)/816)}fit();window.addEventListener("resize",fit)})()</script>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>Back of the Box booklet</title><style>${css}</style></head><body>${sheets.join("")}${script}</body></html>`;
}
