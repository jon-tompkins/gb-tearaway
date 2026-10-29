import type { AgeBand } from "./types";
import { generateMaze, mazeToSvg } from "./puzzles/maze";
import { generateWordFind, wordFindToSvg } from "./puzzles/wordfind";
import { generateColorByNumber, colorByNumberToSvg } from "./puzzles/colorbynumber";
import { bandFromDifficulty } from "./difficulty";

export type BookletKind = "maze" | "wordfind" | "colorbynumber" | "mix";
export type BookletLayout = "full" | "half";

export interface BookletOptions {
  kind: BookletKind;
  /** full = one puzzle per sheet, half = two per sheet. */
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

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

interface Item {
  kind: Exclude<BookletKind, "mix">;
  /** The printed puzzle (without answers). */
  html: string;
  /** Small answer-key picture, when the puzzle has one. */
  answerHtml?: string;
}

/** Fit an SVG inside its box without stretching. */
const fit = (svg: string) => svg.replace(' preserveAspectRatio="none"', "").replace(/ width="[\d.]+" height="[\d.]+"/, "");

function buildItem(kind: Item["kind"], seed: number, difficulty: number, half: boolean): Item {
  const band: AgeBand = bandFromDifficulty(difficulty);
  if (kind === "maze") {
    // Letter content area is about 7.1in × 9.9in; a half sheet is 7.1in × 4.8in.
    const base = Math.max(8, Math.round(6 + difficulty * 1.2));
    const dims = half ? { cols: Math.round(base * 1.45), rows: base } : { cols: base, rows: Math.round(base * 1.38) };
    const maze = generateMaze(seed, band, difficulty, { dims });
    return {
      kind,
      html: `<div class="fig">${fit(mazeToSvg(maze, { showPath: false, maxWidth: 900 }))}</div>`,
      answerHtml: `<div class="fig">${fit(mazeToSvg(maze, { showPath: true, maxWidth: 900 }))}</div>`,
    };
  }
  if (kind === "wordfind") {
    const wf = generateWordFind(seed, band, difficulty);
    const grid = fit(wordFindToSvg(wf, 900, { maxCell: 80 }));
    const words = `<div class="words">${wf.words.map((w) => `<span>${esc(w)}</span>`).join("")}</div>`;
    return {
      kind,
      html: half
        ? `<div class="wf-half"><div class="fig">${grid}</div>${words}</div>`
        : `<div class="wf-full"><div class="fig">${grid}</div>${words}</div>`,
      answerHtml: `<div class="fig">${fit(wordFindToSvg(wf, 900, { maxCell: 80, showAnswers: true }))}</div>`,
    };
  }
  const cbn = generateColorByNumber(seed, band);
  return { kind, html: `<div class="fig">${fit(colorByNumberToSvg(cbn, { maxWidth: 480 }))}</div>` };
}

const MIX_ORDER: Item["kind"][] = ["maze", "wordfind", "colorbynumber"];

export function buildBookletHtml(opts: BookletOptions, extra: { autoPrint?: boolean } = {}): string {
  const pages = Math.max(BOOKLET_LIMITS.minPages, Math.min(BOOKLET_LIMITS.maxPages, Math.round(opts.pages)));
  const per = opts.layout === "half" ? 2 : 1;
  const total = pages * per;
  const half = opts.layout === "half";

  const items: Item[] = [];
  for (let i = 0; i < total; i++) {
    const kind = opts.kind === "mix" ? MIX_ORDER[i % MIX_ORDER.length] : opts.kind;
    // Different seed per puzzle, stable for a given booklet seed.
    items.push(buildItem(kind, (opts.seed + i * 7919) >>> 0, opts.difficulty, half));
  }

  const sheets: string[] = [];
  for (let s = 0; s < pages; s++) {
    const body = items
      .slice(s * per, s * per + per)
      .map((it) => `<div class="cell ${it.kind}">${it.html}</div>`)
      .join("");
    sheets.push(`<section class="sheet ${half ? "half" : "full"}">${body}</section>`);
  }

  if (opts.answers) {
    const keyed = items.map((it, i) => ({ it, n: i + 1 })).filter((x) => x.it.answerHtml);
    const perKey = 6;
    for (let k = 0; k < keyed.length; k += perKey) {
      const cells = keyed
        .slice(k, k + perKey)
        .map(
          ({ it, n }) =>
            `<div class="key-cell"><div class="key-n">${half ? `Page ${Math.ceil(n / 2)}${n % 2 ? "a" : "b"}` : `Page ${n}`}</div>${it.answerHtml}</div>`,
        )
        .join("");
      sheets.push(`<section class="sheet key"><div class="key-title">Answers</div><div class="key-grid">${cells}</div></section>`);
    }
  }

  // Binder margin: the punched edge gets 0.9in; with duplex it alternates sides.
  const inner = opts.binder ? 0.9 : 0.5;
  const css = `
@page { size: 8.5in 11in; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; color: #1c1915; font-family: ui-monospace, Menlo, monospace; }
.sheet { width: 8.5in; height: 11in; padding: 0.5in 0.5in 0.5in ${inner}in; page-break-after: always; break-after: page; display: flex; flex-direction: column; gap: 0.3in; overflow: hidden; }
.sheet:last-child { page-break-after: auto; break-after: auto; }
${opts.duplex ? `.sheet:nth-child(even) { padding: 0.5in ${inner}in 0.5in 0.5in; }` : ""}
.cell { flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.fig { width: 100%; flex: 1 1 0; min-height: 0; display: flex; align-items: center; justify-content: center; }
.fig svg { max-width: 100%; max-height: 100%; width: 100%; height: 100%; }
.words { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.06in 0.25in; font-size: 13pt; font-weight: 700; letter-spacing: 0.04em; padding-top: 0.12in; }
.wf-full, .wf-half { width: 100%; height: 100%; display: flex; flex-direction: column; min-height: 0; }
.wf-half { flex-direction: row; align-items: center; gap: 0.25in; }
.wf-half .words { flex-direction: column; flex-wrap: nowrap; gap: 0.06in; width: 1.5in; padding: 0; font-size: 11pt; justify-content: center; }
.wf-half .fig { flex: 1 1 0; }
.key { flex-direction: column; }
.key-title { font-size: 16pt; font-weight: 700; text-align: center; }
.key-grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr 1fr; gap: 0.2in; min-height: 0; }
.key-cell { display: flex; flex-direction: column; min-height: 0; }
.key-n { font-size: 9pt; font-weight: 700; margin-bottom: 0.04in; }
.key-cell .fig { flex: 1 1 0; }
@media screen { body { background: #e9e4d8; } .sheet { background: #fff; margin: 0.2in auto; box-shadow: 0 2px 12px rgba(0,0,0,.18); } }
`;
  const script = extra.autoPrint
    ? `<script>window.addEventListener("load",function(){setTimeout(function(){window.print()},300)})</script>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><title>Back of the Box booklet</title><style>${css}</style></head><body>${sheets.join("")}${script}</body></html>`;
}
