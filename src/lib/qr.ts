import qrcode from "qrcode-generator";

/**
 * Render a URL as a crisp monochrome QR <svg> (black modules on transparent),
 * suitable for thermal/PDF print. Error-correction "M" balances density vs
 * scannability for short answer-page URLs.
 */
export function qrSvg(text: string, opts: { sizePx?: number } = {}): string {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  const cell = 4; // viewBox units per module
  const size = count * cell;
  let rects = "";
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        rects += `<rect x="${c * cell}" y="${r * cell}" width="${cell}" height="${cell}"/>`;
      }
    }
  }
  const px = opts.sizePx ?? size;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" fill="#000">${rects}</svg>`;
}
