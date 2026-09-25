import type { PrintJob, StripSection, WeatherSnapshot } from "./types";
import { mazeToSvg } from "./puzzles/maze";
import { sudokuToSvg } from "./puzzles/sudoku";
import { wordFindToSvg } from "./puzzles/wordfind";
import { dotsToSvg } from "./puzzles/dots";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type IconType = "sun" | "partly" | "cloud" | "rain" | "snow" | "thunder" | "fog";
function wxIconType(code: number): IconType {
  if (code === 0 || code === 1) return "sun";
  if (code === 2) return "partly";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "thunder";
  return "cloud";
}
function condName(code: number): string {
  return {
    sun: "Clear",
    partly: "Partly cloudy",
    cloud: "Cloudy",
    rain: "Rain",
    snow: "Snow",
    thunder: "Storms",
    fog: "Fog",
  }[wxIconType(code)];
}
/** Monochrome inline SVG weather glyph (thermal-friendly, black on white). */
function weatherIcon(code: number, px: number): string {
  const t = wxIconType(code);
  const open = `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle">`;
  const rays =
    '<line x1="12" y1="1.5" x2="12" y2="3.6"/><line x1="12" y1="20.4" x2="12" y2="22.5"/><line x1="1.5" y1="12" x2="3.6" y2="12"/><line x1="20.4" y1="12" x2="22.5" y2="12"/><line x1="4.6" y1="4.6" x2="6.1" y2="6.1"/><line x1="17.9" y1="17.9" x2="19.4" y2="19.4"/><line x1="4.6" y1="19.4" x2="6.1" y2="17.9"/><line x1="17.9" y1="6.1" x2="19.4" y2="4.6"/>';
  const cloud = (dy = 0) =>
    `<path d="M6 ${17 + dy} h10 a3.1 3.1 0 0 0 .3 -6.2 A4.6 4.6 0 0 0 7.2 ${9.6 + dy} A3.4 3.4 0 0 0 6 ${17 + dy} z"/>`;
  if (t === "sun") return `${open}<circle cx="12" cy="12" r="4"/>${rays}</svg>`;
  if (t === "partly")
    return `${open}<circle cx="8" cy="8" r="2.8"/><line x1="8" y1="2.8" x2="8" y2="4.1"/><line x1="2.8" y1="8" x2="4.1" y2="8"/><line x1="12" y1="4" x2="11" y2="5"/>${cloud(1)}</svg>`;
  if (t === "cloud") return `${open}${cloud()}</svg>`;
  if (t === "rain")
    return `${open}${cloud(-1.5)}<line x1="8.5" y1="18" x2="7.5" y2="21"/><line x1="12" y1="18" x2="11" y2="21"/><line x1="15.5" y1="18" x2="14.5" y2="21"/></svg>`;
  if (t === "snow")
    return `${open}${cloud(-1.5)}<circle cx="8.5" cy="20" r=".7" fill="#000"/><circle cx="12" cy="20.6" r=".7" fill="#000"/><circle cx="15.5" cy="20" r=".7" fill="#000"/></svg>`;
  if (t === "thunder")
    return `${open}${cloud(-1.5)}<polyline points="12,17.5 10,20.5 12.4,20.5 10.6,23.5"/></svg>`;
  return `${open}${cloud(-2)}<line x1="6" y1="19" x2="16" y2="19"/><line x1="7.5" y1="21.5" x2="14.5" y2="21.5"/></svg>`;
}
/** Rich weather block: current + morning/afternoon/evening + 7-day, all mono. */
export function weatherHtml(w: WeatherSnapshot, opts: { compact?: boolean } = {}): string {
  const code = w.code ?? 1;
  const now = w.tempF != null ? `${w.tempF}°` : "—";
  let h = `<div style="width:100%;font-family:ui-monospace,'SFMono-Regular',Menlo,monospace;color:#000">`;
  const hiLo =
    w.highF != null && w.lowF != null
      ? `<br><span style="font-size:7.5pt">H ${w.highF}° · L ${w.lowF}°</span>`
      : "";
  // Morning/Afternoon/Evening mini-forecast (M / A / E) for the compact header.
  const periodsMini = w.periods?.length
    ? `<div style="display:flex;gap:6px;flex-shrink:0">${w.periods
        .map(
          (p) => `<div style="text-align:center">
        <div style="font-size:6pt;font-weight:700;text-transform:uppercase">${esc(p.label.charAt(0))}</div>
        <div style="line-height:0;margin:1px 0">${weatherIcon(p.code, 15)}</div>
        <div style="font-size:8pt;font-weight:700">${p.tempF != null ? `${p.tempF}°` : "—"}</div>
      </div>`,
        )
        .join("")}</div>`
    : "";
  // Compact (half card): today (with M/A/E to the right) + the 7-day strip.
  if (opts.compact) {
    h += `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:1mm">
      <div style="display:flex;align-items:center;gap:7px">
        ${weatherIcon(code, 28)}
        <span style="font-size:16pt;font-weight:700;line-height:1">${now}</span>
        <span style="font-size:8.5pt;line-height:1.15">${esc(w.label)}<br>${esc(condName(code))}${hiLo}</span>
      </div>
      ${periodsMini}
    </div>`;
    if (w.daily?.length) {
      h += `<div style="display:flex;gap:2px;border-top:1px solid #000;padding-top:1.2mm;margin-top:0.5mm">${w.daily
        .map(
          (d) => `<div style="flex:1;text-align:center">
        <div style="font-size:5.5pt;font-weight:700;text-transform:uppercase">${esc(d.day)}</div>
        <div style="line-height:0;margin:1px 0">${weatherIcon(d.code, 12)}</div>
        <div style="font-size:6pt;font-weight:700">${d.hi != null ? d.hi : "—"}°</div>
        <div style="font-size:5.5pt">${d.lo != null ? d.lo : "—"}°</div>
      </div>`,
        )
        .join("")}</div>`;
    }
    h += `</div>`;
    return h;
  }
  // Full (double card): big header, then periods row, then the 7-day strip.
  h += `<div style="display:flex;align-items:center;gap:7px;margin-bottom:2mm">
    ${weatherIcon(code, 34)}
    <span style="font-size:19pt;font-weight:700;line-height:1">${now}</span>
    <span style="font-size:8.5pt;line-height:1.15">${esc(w.label)}<br>${esc(condName(code))}</span>
  </div>`;
  if (w.periods?.length) {
    h += `<div style="display:flex;gap:4px;margin-bottom:2mm">${w.periods
      .map(
        (p) => `<div style="flex:1;text-align:center">
        <div style="font-size:6.5pt;font-weight:700;letter-spacing:.04em;text-transform:uppercase">${esc(p.label)}</div>
        <div style="line-height:0;margin:1px 0">${weatherIcon(p.code, 18)}</div>
        <div style="font-size:9pt;font-weight:700">${p.tempF != null ? `${p.tempF}°` : "—"}</div>
      </div>`,
      )
      .join("")}</div>`;
  }
  if (w.daily?.length) {
    h += `<div style="display:flex;gap:2px;border-top:1px solid #000;padding-top:1.5mm">${w.daily
      .map(
        (d) => `<div style="flex:1;text-align:center">
        <div style="font-size:6pt;font-weight:700;text-transform:uppercase">${esc(d.day)}</div>
        <div style="line-height:0;margin:1px 0">${weatherIcon(d.code, 13)}</div>
        <div style="font-size:6.5pt;font-weight:700">${d.hi != null ? d.hi : "—"}°</div>
        <div style="font-size:6pt">${d.lo != null ? d.lo : "—"}°</div>
      </div>`,
      )
      .join("")}</div>`;
  }
  h += `</div>`;
  return h;
}

export function sectionHtml(section: StripSection): string {
  if (section.kind === "header") {
    return `<header class="hdr">
      <div class="mast">${esc(section.lines[0] ?? "Back of the Box")}</div>
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

  if (section.news?.length) {
    const sizeClass = section.size ? ` size-${section.size}` : "";
    const items = section.news
      .map(
        (i) =>
          `<div><div style="font-weight:700;font-size:9pt;line-height:1.15">${esc(
            i.headline,
          )}</div><div style="font-size:8.2pt;line-height:1.3">${
            i.location
              ? `<span style="font-weight:700;text-transform:uppercase;letter-spacing:.02em">${esc(
                  i.location,
                )}</span> — `
              : ""
          }${esc(i.blurb)}</div></div>`,
      )
      .join("");
    // Stretch stories to fill the card — 3 in a 4-slot card spread out instead
    // of leaving a gap at the bottom.
    return `<section class="sec${sizeClass} mod-${section.moduleId}">
    <h3>${esc(section.title)}</h3>
    <div style="flex:1;min-height:0;display:flex;flex-direction:column;justify-content:space-between;gap:1.6mm">${items}</div>
  </section>`;
  }

  if (section.kind === "weather" && section.weather?.periods) {
    const sizeClass = section.size ? ` size-${section.size}` : "";
    return `<section class="sec${sizeClass}">
    <h3>${esc(section.title)}</h3>
    ${weatherHtml(section.weather, { compact: section.size === "half" })}
  </section>`;
  }

  const svg =
    section.svg ||
    (section.kind === "maze" && section.maze
      ? mazeToSvg(section.maze, { showPath: false })
      : section.kind === "sudoku" && section.sudoku
        ? sudokuToSvg(section.sudoku, { showSolution: false })
        : section.kind === "wordfind" && section.wordfind
          ? wordFindToSvg(section.wordfind)
          : section.kind === "dots" && section.dots
            ? dotsToSvg(section.dots)
            : "");

  const lines = section.lines.map((l) => `<p>${esc(l)}</p>`).join("");
  const sizeClass = section.size ? ` size-${section.size}` : "";
  // Figure cards (maze/sudoku/etc.) grow to fill the column's leftover space so
  // there's no wasted gap; text cards stay at their natural height.
  const growClass = svg ? " grow" : "";
  // Maze fills its card; the number grid stays small (~half a maze).
  const figClass =
    section.kind === "maze" ? "fig fig-fill" : section.kind === "sudoku" ? "fig fig-small" : "fig";
  return `<section class="sec${growClass}${sizeClass} mod-${section.moduleId}">
    <h3>${esc(section.title)}</h3>
    ${lines}
    ${svg ? `<div class="${figClass}">${svg}</div>` : ""}
  </section>`;
}

/** Pure HTML/SVG preview — no react-dom/server. */
export function buildPreviewHtml(job: PrintJob): string {
  const isLetter = job.paperSize === "letter";
  const width = isLetter ? Math.min(job.widthPx || 612, 612) : Math.min(job.widthPx || 384, 384);
  const header = job.sections.find((s) => s.kind === "header");
  const footer = job.sections.find((s) => s.kind === "footer");
  const body = job.sections.filter((s) => s.kind !== "header" && s.kind !== "footer");

  const bodyHtml = isLetter
    ? `<div class="cols">${body.map(sectionHtml).join("\n")}</div>`
    : body.map(sectionHtml).join("\n");

  const html = [
    header ? sectionHtml(header) : "",
    bodyHtml,
    footer ? sectionHtml(footer) : "",
  ].join("\n");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  body{margin:0;background:#f4eee3;color:#1c1915;font-family:ui-monospace,Menlo,monospace}
  .strip{width:${width}px;margin:0 auto;background:#f7f1e3;padding:14px 14px 18px;box-sizing:border-box;border:1px solid rgba(28,25,21,.12)${
    isLetter ? ";min-height:792px" : ""
  }}
  .cols{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px}
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
  .ftr{text-align:center;padding-top:8px;grid-column:1/-1}
  .perf{border-top:2px dashed #cfc4b0;margin:0 10% 8px}
  .tear{font-size:11px;font-weight:700;letter-spacing:.24em;color:#c45c26}
  .closer{font-size:11px;opacity:.8;margin:8px 0 4px}
  .brand{font-size:9px;letter-spacing:.16em;text-transform:uppercase;opacity:.55}
</style></head><body><div class="strip">${html}</div></body></html>`;
}
