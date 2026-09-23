import type { PrintJob } from "./types";
import { sectionHtml } from "./previewHtml";

/**
 * Print / PDF HTML — sized in real millimetres for the physical medium, not the
 * on-screen px preview. Monochrome (thermal paper is black-on-white), with an
 * @page rule so "Save as PDF" produces a file at the exact paper size:
 *   - strip58 → 58mm wide, continuous height (`size: 58mm auto`)
 *   - letter  → US Letter with a print margin
 *
 * This is the browser-native, dependency-free path (no headless Chromium in the
 * app), so it stays portable to serverless. `autoPrint` opens the print dialog
 * on load for a one-click Save-as-PDF.
 */
/** Simulate CSS 2-column dense grid placement to get the true row count. */
function packedRows(sizes: ("half" | "full" | "double")[]): number {
  const COLS = 2;
  const occ: boolean[][] = [];
  const ensure = (r: number) => {
    while (occ.length <= r) occ.push([false, false]);
  };
  const fits = (r: number, c: number, w: number, h: number): boolean => {
    if (c + w > COLS) return false;
    for (let i = 0; i < h; i++) {
      ensure(r + i);
      for (let j = 0; j < w; j++) if (occ[r + i][c + j]) return false;
    }
    return true;
  };
  const place = (r: number, c: number, w: number, h: number) => {
    for (let i = 0; i < h; i++) {
      ensure(r + i);
      for (let j = 0; j < w; j++) occ[r + i][c + j] = true;
    }
  };
  let maxRow = 0;
  for (const s of sizes) {
    const w = 1; // all cards stay one column wide (works on the 58mm receipt printer too)
    const h = s === "half" ? 1 : s === "double" ? 4 : 2;
    let placed = false;
    for (let r = 0; !placed && r < 400; r++) {
      for (let c = 0; c < COLS && !placed; c++) {
        if (fits(r, c, w, h)) {
          place(r, c, w, h);
          maxRow = Math.max(maxRow, r + h);
          placed = true;
        }
      }
    }
  }
  return Math.max(1, maxRow);
}

export function buildPrintHtml(
  job: PrintJob,
  opts: { autoPrint?: boolean } = {},
): string {
  const isLetter = job.paperSize === "letter";
  const header = job.sections.find((s) => s.kind === "header");
  const body = job.sections.filter(
    (s) => s.kind !== "header" && s.kind !== "footer",
  );
  const esc = (s: string) =>
    String(s ?? "").replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string,
    );

  // Exact row count for the 2-column dense grid (half=1×1, full=1×2, double=2×2),
  // so grid-template-rows: repeat(rows,1fr) always fills one page, any size mix.
  const gridRows = packedRows(body.map((s) => s.size ?? "full"));

  let inner: string;
  if (isLetter) {
    // one-line minimal header (title · kid · date)
    const dateLine = header?.lines?.[2] ?? "";
    const hdr1 = `<div class="hdr1"><b>Tearaway</b> · ${esc(job.kidName)} · ${esc(dateLine)}</div>`;
    const bodyHtml = `<div class="cols">${body.map(sectionHtml).join("\n")}</div>`;
    const ftr1 = `<div class="ftr1">— tear here —</div>`;
    inner = [hdr1, bodyHtml, ftr1].join("\n");
  } else {
    const footer = job.sections.find((s) => s.kind === "footer");
    inner = [
      header ? sectionHtml(header) : "",
      body.map(sectionHtml).join("\n"),
      footer ? sectionHtml(footer) : "",
    ].join("\n");
  }

  // Letter is a valid named size. The 58mm strip is a continuous roll, so we
  // measure the rendered height on load and inject an exact `@page{size:58mm Hmm}`
  // (mixing a length with `auto` is invalid CSS and gets dropped → Letter fallback).
  const page = isLetter
    ? "@page{size:Letter;margin:10mm 12mm}"
    : "@page{size:58mm 200mm;margin:0}";

  // 58mm paper, ~3mm side margins → ~52mm printable column.
  const stripCss = `
  html,body{background:#fff;color:#000}
  .sheet{width:58mm;margin:0 auto;padding:4mm 3mm 6mm;box-sizing:border-box}
  .mast{font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:15pt;line-height:1.05;text-align:center;letter-spacing:-.01em}
  .for{text-align:center;font-size:8pt;font-weight:700;letter-spacing:.14em;margin-top:1.5mm}
  .meta{text-align:center;font-size:6.5pt;letter-spacing:.04em;text-transform:uppercase;margin-top:.6mm}
  .hdr{border-bottom:2px solid #000;padding-bottom:2mm;margin-bottom:2mm}
  .sec{border-bottom:1px dashed #000;padding:2.4mm 0}
  .sec h3{margin:0 0 1.2mm;font-size:6.5pt;letter-spacing:.16em;text-transform:uppercase}
  .sec p{margin:0 0 1mm;font-size:8.5pt;line-height:1.35}
  .fig{margin-top:1.6mm;text-align:center}
  .ftr{text-align:center;padding-top:2mm}
  .perf{border-top:1.5px dashed #000;margin:0 10% 1.6mm}
  .tear{font-size:7pt;font-weight:700;letter-spacing:.24em}
  .closer{font-size:7pt;margin:1.6mm 0 .8mm}
  .brand{font-size:6pt;letter-spacing:.16em;text-transform:uppercase}`;

  const letterCss = `
  html,body{background:#fff;color:#000}
  /* fill the whole printable page: fixed-height flex column, grid grows to fit */
  .sheet{width:100%;height:252mm;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden}
  /* minimal one-line header + footer */
  .hdr1{font-family:Georgia,'Times New Roman',serif;font-size:11pt;text-align:center;padding-bottom:1.2mm;margin-bottom:2.5mm;border-bottom:1px solid #000}
  .ftr1{text-align:center;font-size:6pt;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:#000;padding-top:1mm;margin-top:1mm}
  /* size-driven grid: cards fill the page, no outlines, tight padding */
  .cols{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(${gridRows},1fr);grid-auto-flow:row dense;gap:3mm 4mm}
  .sec{padding:0 1mm;overflow:hidden;display:flex;flex-direction:column;min-height:0}
  .sec.size-half{grid-column:span 1;grid-row:span 1}
  .sec.size-full{grid-column:span 1;grid-row:span 2}
  .sec.size-double{grid-column:span 1;grid-row:span 4}
  .sec h3{margin:0 0 1mm;font-size:8pt;letter-spacing:.14em;text-transform:uppercase}
  .sec p{margin:0 0 1mm;font-size:9.5pt;line-height:1.3}
  /* puzzles fill the whole card */
  .fig{flex:1;min-height:0;margin-top:1mm;display:flex;align-items:center;justify-content:center}
  .fig svg{max-width:100%;max-height:100%;height:auto;width:auto}`;

  // For the strip, size the print page to the actual content height so the PDF
  // is one continuous 58mm-wide page (no half-empty trailing page).
  const fit = `<script>
    (function(){
      var isLetter=${isLetter ? "true" : "false"}, auto=${opts.autoPrint ? "true" : "false"};
      function go(){
        if(!isLetter){
          var el=document.querySelector('.sheet');
          if(el){ var h=Math.ceil(el.getBoundingClientRect().height*25.4/96)+2;
            var st=document.createElement('style');
            st.textContent='@page{size:58mm '+h+'mm;margin:0}';
            document.head.appendChild(st); }
        }
        if(auto) setTimeout(function(){try{window.print()}catch(e){}},250);
      }
      if(document.readyState==='complete') go();
      else window.addEventListener('load',go);
    })();
  </script>`;
  const auto = fit;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Tearaway · ${job.kidName} · ${job.date}</title>
<style>
  ${page}
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;font-family:ui-monospace,'SFMono-Regular',Menlo,Consolas,monospace;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  ${isLetter ? letterCss : stripCss}
  /* thermal is black-only: force accent strokes/fills to black */
  .fig svg [stroke="#c45c26"]{stroke:#000}
  .fig svg [fill="#c45c26"]{fill:#000}
  .fig svg{max-width:100%;height:auto}
  /* screen-only toolbar (hidden in the actual print/PDF) */
  .bar{position:fixed;top:0;left:0;right:0;display:flex;gap:8px;justify-content:center;align-items:center;
    padding:10px;background:#111;color:#fff;font:600 13px ui-monospace,monospace;z-index:9}
  .bar button{border:0;border-radius:8px;background:#fff;color:#111;font:inherit;padding:8px 14px;cursor:pointer}
  .bar span{opacity:.75;font-weight:500}
  body{padding-top:52px}
  @media print{.bar{display:none}body{padding-top:0}}
</style></head>
<body>
  <div class="bar">
    <span>${isLetter ? "US Letter" : "58mm strip"} · ${job.kidName} · ${job.date}</span>
    <button type="button" onclick="window.print()">Save as PDF / Print</button>
  </div>
  <div class="sheet">${inner}</div>
  ${auto}
</body></html>`;
}
