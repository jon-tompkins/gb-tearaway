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

  let inner: string;
  if (isLetter) {
    // one-line minimal header (title · kid · date)
    const dateLine = header?.lines?.[2] ?? "";
    const hdr1 = `<div class="hdr1"><b>Tearaway</b> · ${esc(job.kidName)} · ${esc(dateLine)}</div>`;
    // Two print columns. Honor the user's per-card column choice; each card fills
    // its share of its column (half=1, full=2, double=4 flex units).
    const colA = body.filter((s) => (s.column ?? 0) !== 1);
    const colB = body.filter((s) => (s.column ?? 0) === 1);
    const col = (arr: typeof body) => `<div class="col">${arr.map(sectionHtml).join("\n")}</div>`;
    const bodyHtml = `<div class="cols">${col(colA)}${col(colB)}</div>`;
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
  /* newspaper: two balanced columns that fill the page, a light rule under each card */
  .sheet{width:100%;height:252mm;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden}
  .hdr1{font-family:Georgia,'Times New Roman',serif;font-size:11pt;text-align:center;padding-bottom:1.2mm;margin-bottom:2.5mm;border-bottom:1.2px solid #000}
  .ftr1{text-align:center;font-size:6pt;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:#000;border-top:1px solid #000;padding-top:1mm;margin-top:1.5mm}
  .cols{flex:1;min-height:0;display:flex;gap:6mm}
  .col{flex:1;min-width:0;display:flex;flex-direction:column}
  /* each card fills its share of the column: half=1, full=2, double=4 units */
  .sec{min-height:0;overflow:hidden;display:flex;flex-direction:column;padding-bottom:2mm;border-bottom:0.5pt solid #000}
  .sec.size-half{flex:1}
  .sec.size-full{flex:2}
  .sec.size-double{flex:4}
  .sec h3{margin:0 0 1.2mm;font-size:8pt;letter-spacing:.14em;text-transform:uppercase;flex:0 0 auto}
  .sec p{margin:0 0 1mm;font-size:9.5pt;line-height:1.3;flex:0 0 auto}
  .fig{flex:1;min-height:0;margin-top:1.2mm;display:flex;align-items:center;justify-content:center}
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
