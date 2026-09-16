import type { PrintJob, StripSection } from "./types";
import { mazeToSvg } from "./puzzles/maze";
import { sudokuToSvg } from "./puzzles/sudoku";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sectionHtml(section: StripSection): string {
  if (section.kind === "header") {
    return `<header class="hdr">
      <div class="mast">${esc(section.lines[0] ?? "Tearaway Times")}</div>
      <div class="for">${esc(section.lines[1] ?? "")}</div>
      <div class="meta">${esc(section.lines[2] ?? "")}</div>
      <div class="meta dim">${esc(section.lines[3] ?? "")}</div>
    </header>`;
  }
  if (section.kind === "footer") {
    return `<footer class="ftr">
      <div class="perf"></div>
      <div class="tear">TEAR HERE</div>
      <p class="closer">${esc(section.lines[1] ?? "")}</p>
      <p class="brand">${esc(section.lines[2] ?? "")}</p>
    </footer>`;
  }

  const svg =
    section.svg ||
    (section.kind === "maze" && section.maze
      ? mazeToSvg(section.maze, { showPath: false })
      : section.kind === "sudoku" && section.sudoku
        ? sudokuToSvg(section.sudoku, { showSolution: false })
        : "");

  const lines = section.lines.map((l) => `<p>${esc(l)}</p>`).join("");
  return `<section class="sec">
    <h3>${esc(section.title)}</h3>
    ${lines}
    ${svg ? `<div class="fig">${svg}</div>` : ""}
  </section>`;
}

/** Pure HTML/SVG preview — no react-dom/server. */
export function buildPreviewHtml(job: PrintJob): string {
  const width = Math.min(job.widthPx || 384, 384);
  const body = job.sections.map(sectionHtml).join("\n");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  body{margin:0;background:#f4eee3;color:#1c1915;font-family:ui-monospace,Menlo,monospace}
  .strip{width:${width}px;margin:0 auto;background:#f7f1e3;padding:14px 14px 18px;box-sizing:border-box;border:1px solid rgba(28,25,21,.12)}
  .mast{font-family:Georgia,serif;font-weight:700;font-size:22px;text-align:center;letter-spacing:-.02em}
  .for{text-align:center;font-size:12px;font-weight:700;letter-spacing:.14em;margin-top:6px}
  .meta{text-align:center;font-size:10px;letter-spacing:.04em;text-transform:uppercase;margin-top:2px}
  .dim{opacity:.7}
  .hdr{border-bottom:3px double #cfc4b0;padding-bottom:8px;margin-bottom:8px}
  .sec{border-bottom:1px dashed #cfc4b0;padding:10px 0}
  .sec h3{margin:0 0 6px;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#c45c26}
  .sec p{margin:0 0 4px;font-size:13px;line-height:1.35}
  .fig{margin-top:8px;text-align:center}
  .fig svg{max-width:100%;height:auto}
  .ftr{text-align:center;padding-top:8px}
  .perf{border-top:2px dashed #cfc4b0;margin:0 10% 8px}
  .tear{font-size:11px;font-weight:700;letter-spacing:.24em;color:#c45c26}
  .closer{font-size:11px;opacity:.8;margin:8px 0 4px}
  .brand{font-size:9px;letter-spacing:.16em;text-transform:uppercase;opacity:.55}
</style></head><body><div class="strip">${body}</div></body></html>`;
}
