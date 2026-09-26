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
export function buildPrintHtml(
  job: PrintJob,
  opts: { autoPrint?: boolean; qrSvg?: string; embed?: boolean } = {},
): string {
  const qrBlock = opts.qrSvg
    ? `<div class="qr"><span class="qrcap">Scan for<br/>answers</span>${opts.qrSvg}</div>`
    : "";
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

  let inner: string;
  if (isLetter) {
    // Masthead: the big title, with a small date beneath (drop the redundant
    // "· name · date" clutter).
    const dateLine = header?.lines?.[2] ?? "";
    const hdr1 = `<div class="hdr1"><div class="mast1">Back of the Box</div><div class="date1">${esc(dateLine)}</div></div>`;
    // Two print columns. Honor the user's per-card column choice; each card fills
    // its share of its column (half=1, full=2, double=4 flex units).
    const colA = body.filter((s) => (s.column ?? 0) !== 1);
    const colB = body.filter((s) => (s.column ?? 0) === 1);
    // Shared row grid: both columns use the same number of 1fr rows (the fuller
    // column's ½-unit total), so every card boundary — and its divider — lands
    // on the same horizontal lines across both columns.
    const unitsOf = (s: (typeof body)[number]) =>
      s.size === "double" ? 4 : s.size === "half" ? 1 : 2;
    const sum = (arr: typeof body) => arr.reduce((n, s) => n + unitsOf(s), 0);
    const rows = Math.max(1, sum(colA), sum(colB));
    const col = (arr: typeof body) =>
      `<div class="col" style="grid-template-rows:repeat(${rows},minmax(0,1fr))">${arr
        .map(sectionHtml)
        .join("\n")}</div>`;
    const bodyHtml = `<div class="cols">${col(colA)}${col(colB)}</div>`;
    const ftr1 = `<div class="ftr1"><div class="ftr1-mid"><div class="tear1">— tear here —</div><div class="brand1">Back of the Box</div></div>${qrBlock}</div>`;
    inner = [hdr1, bodyHtml, ftr1].join("\n");
  } else {
    const footer = job.sections.find((s) => s.kind === "footer");
    inner = [
      header ? sectionHtml(header) : "",
      body.map(sectionHtml).join("\n"),
      footer ? sectionHtml(footer) : "",
      qrBlock,
    ].join("\n");
  }

  // Letter is a valid named size. The 58mm strip is a continuous roll, so we
  // measure the rendered height on load and inject an exact `@page{size:58mm Hmm}`
  // (mixing a length with `auto` is invalid CSS and gets dropped → Letter fallback).
  // margin:0 suppresses the browser's own print header/footer (the page URL,
  // date, and title it injects into the margins). We reinstate a safe print
  // margin as padding inside .sheet instead.
  // Use EXPLICIT millimetre dimensions, not the `Letter` keyword: mobile Safari /
  // Brave ignore the keyword and fall back to their own page size + margins, which
  // overflows the fixed-height sheet onto a blank second page. Explicit mm + a
  // matching sheet works cross-device (same trick the 58mm strip uses).
  const page = isLetter
    ? "@page{size:215.9mm 279.4mm;margin:0}"
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
  .brand{font-size:6pt;letter-spacing:.16em;text-transform:uppercase}
  .qr{text-align:center;margin-top:2mm}
  .qr svg{width:20mm;height:20mm}
  .qrcap{font-size:6pt;letter-spacing:.08em;text-transform:uppercase;margin-top:.8mm}`;

  const letterCss = `
  html,body{background:#fff;color:#000}
  /* newspaper: two balanced columns that fill the page, a light rule under each card */
  /* Fixed vertical budget: 15mm masthead + 224.4mm columns + 16mm footer =
     255.4mm (the 279.4mm page minus 12mm padding top/bottom). Giving the
     column band an explicit height makes the grid rows definite, so tall
     content clips instead of growing its row (Chromium print doesn't resolve
     grid fr heights from flex:1). */
  .sheet{width:100%;height:279.4mm;box-sizing:border-box;padding:12mm;overflow:hidden}
  .hdr1{height:15mm;box-sizing:border-box;text-align:center;padding-bottom:1.6mm;border-bottom:1.4px solid #000}
  .mast1{font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:18pt;line-height:1;letter-spacing:-.01em}
  .date1{font-size:7pt;letter-spacing:.06em;text-transform:uppercase;margin-top:1mm}
  .ftr1{position:relative;height:16mm;box-sizing:border-box;display:flex;align-items:center;justify-content:center;border-top:1px solid #000;padding-top:1.4mm}
  .ftr1-mid{text-align:center}
  .ftr1 .tear1{font-size:6pt;font-weight:700;letter-spacing:.24em;text-transform:uppercase}
  .ftr1 .brand1{font-family:Georgia,'Times New Roman',serif;font-size:8pt;font-weight:700;margin-top:.8mm}
  /* QR pinned to the bottom-right, caption beside it */
  .ftr1 .qr{position:absolute;right:0;bottom:1.5mm;display:flex;align-items:center;gap:1.6mm;line-height:0}
  .ftr1 .qr svg{width:11mm;height:11mm}
  .ftr1 .qrcap{font-size:5.5pt;font-weight:700;letter-spacing:.06em;text-transform:uppercase;line-height:1.15;text-align:right}
  .cols{height:224.4mm;display:flex;gap:6mm}
  .col{flex:1;min-width:0;height:100%;display:grid}
  /* Each card spans its ½-unit footprint in the shared row grid, so dividers
     align column-to-column. Content is clipped to its cell if it overruns. */
  .sec{min-height:0;overflow:hidden;display:flex;flex-direction:column;padding:1.4mm 0 2mm;border-bottom:0.5pt solid #000}
  .sec.size-half{grid-row:span 1}
  .sec.size-full{grid-row:span 2}
  .sec.size-double{grid-row:span 4}
  .sec:last-child{border-bottom:0}
  .sec h3{margin:0 0 1.2mm;font-size:8pt;letter-spacing:.14em;text-transform:uppercase;flex:0 0 auto}
  .sec p{margin:0 0 1mm;font-size:9.5pt;line-height:1.3;flex:0 0 auto}
  /* This-day-in-history: tighter so more text fits in a half card */
  .mod-history p{font-size:8pt;line-height:1.28}
  .mod-history p:first-of-type{font-weight:700}
  .fig{flex:1;min-height:0;margin-top:1.2mm;display:flex;align-items:center;justify-content:center}
  /* Figures scale up to the column width (bigger sudoku/word-find), capped to card height */
  .fig svg{width:100%;height:auto;max-width:100%;max-height:100%}
  /* Number grid stays compact — about half a maze */
  .fig.fig-small svg{width:auto;max-width:46mm;max-height:100%}
  /* Maze stretches to fill its card — rectangular cells are fine and kill the gaps */
  .col .fig-fill svg{width:100%;height:100%;max-width:none;max-height:none}`;

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
  // Embed mode (on-screen preview inside an iframe): no toolbar, no auto-print,
  // no top padding — just the sheet, so the preview is pixel-identical to print.
  const embed = !!opts.embed;
  const auto = embed ? "" : fit;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Back of the Box</title>
<style>
  ${page}
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;font-family:ui-monospace,'SFMono-Regular',Menlo,Consolas,monospace;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  ${isLetter ? letterCss : stripCss}
  /* thermal is black-only: force accent strokes/fills to black */
  .fig svg [stroke="#c45c26"]{stroke:#000}
  .fig svg [fill="#c45c26"]{fill:#000}
  .fig svg{max-width:100%;height:auto}
  body{padding-top:0}
</style></head>
<body>
  <div class="sheet">${inner}</div>
  ${auto}
</body></html>`;
}
