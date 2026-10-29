import type { AgeBand, ColorByNumberData } from "../types";
import { mulberry32, pick } from "../rng";

interface Sprite {
  title: string;
  bands: AgeBand[];
  /** One char per cell; "." is blank paper. Keys map to palette entries. */
  rows: string[];
  palette: Record<string, { name: string; hex: string }>;
}

const SPRITES: Sprite[] = [
  {
    title: "A big red heart",
    bands: ["4-6", "7-9"],
    palette: { R: { name: "Red", hex: "#d6322f" }, P: { name: "Pink", hex: "#f39ab0" } },
    rows: [
      "............",
      ".RRR....RRR.",
      "RRRRR..RRRRR",
      "RPPRRRRRRRRR",
      "RPRRRRRRRRRR",
      "RRRRRRRRRRRR",
      ".RRRRRRRRRR.",
      "..RRRRRRRR..",
      "...RRRRRR...",
      "....RRRR....",
      ".....RR.....",
      "............",
    ],
  },
  {
    title: "A shining star",
    bands: ["4-6", "7-9"],
    palette: { Y: { name: "Yellow", hex: "#f5cd2f" }, O: { name: "Orange", hex: "#f08a24" } },
    rows: [
      ".....YY.....",
      ".....YY.....",
      "....YYYY....",
      "YYYYYYYYYYYY",
      ".YYYYYYYYYY.",
      "..YYYOOYYY..",
      "...YYOOYY...",
      "...YYYYYY...",
      "..YYYYYYYY..",
      "..YYY..YYY..",
      ".YYY....YYY.",
      ".YY......YY.",
    ],
  },
  {
    title: "A fish with a big tail",
    bands: ["4-6", "7-9"],
    palette: { O: { name: "Orange", hex: "#f08a24" }, K: { name: "Black", hex: "#222222" } },
    rows: [
      "............",
      "....OOOO....",
      "..OOOOOOO..O",
      ".OOKOOOOOOOO",
      ".OOOOOOOOOOO",
      "..OOOOOOO..O",
      "....OOOO....",
      "............",
    ],
  },
  {
    title: "An apple tree",
    bands: ["4-6", "7-9"],
    palette: {
      G: { name: "Green", hex: "#3c9a4a" },
      B: { name: "Brown", hex: "#8a5a2b" },
      R: { name: "Red", hex: "#d6322f" },
    },
    rows: [
      "....GGGG....",
      "..GGGGGGGG..",
      ".GGRGGGGGRG.",
      ".GGGGGGGGGG.",
      "GGGGGRGGGGGG",
      "GGRGGGGGGRGG",
      ".GGGGGGGGGG.",
      "..GGGGGGGG..",
      ".....BB.....",
      ".....BB.....",
      ".....BB.....",
      "....BBBB....",
    ],
  },
  {
    title: "An ice cream cone",
    bands: ["4-6", "7-9"],
    palette: {
      R: { name: "Red", hex: "#d6322f" },
      P: { name: "Pink", hex: "#f39ab0" },
      C: { name: "Cream", hex: "#f6e7a8" },
      T: { name: "Brown", hex: "#b9782f" },
    },
    rows: [
      "....RR......",
      "....RR......",
      "...PPPPPP...",
      "..PPPPPPPP..",
      ".PPPPPPPPPP.",
      ".CCCCCCCCCC.",
      "..TTTTTTTT..",
      "...TTTTTT...",
      "....TTTT....",
      ".....TT.....",
    ],
  },
  {
    title: "A butterfly",
    bands: ["7-9", "10-12"],
    palette: {
      P: { name: "Purple", hex: "#7a4fc2" },
      O: { name: "Orange", hex: "#f08a24" },
      K: { name: "Black", hex: "#222222" },
    },
    rows: [
      "PP........PP",
      "PPP..KK..PPP",
      "PPPPPKKPPPPP",
      ".PPPPKKPPPP.",
      "..OOOKKOOO..",
      ".OOOOKKOOOO.",
      ".OOOOKKOOOO.",
      "..OOO..OOO..",
      "...OO..OO...",
      "............",
    ],
  },
  {
    title: "A little sailboat",
    bands: ["7-9", "10-12"],
    palette: {
      K: { name: "Black", hex: "#222222" },
      Y: { name: "Yellow", hex: "#f5cd2f" },
      R: { name: "Red", hex: "#d6322f" },
      B: { name: "Brown", hex: "#8a5a2b" },
      U: { name: "Blue", hex: "#2f6fd6" },
    },
    rows: [
      ".....K......",
      "....YKR.....",
      "...YYKRR....",
      "..YYYKRRR...",
      ".YYYYKRRRR..",
      "YYYYYKRRRRR.",
      ".....K......",
      "BBBBBBBBBBBB",
      ".BBBBBBBBBB.",
      "..BBBBBBBB..",
      "UUUUUUUUUUUU",
      "UUUUUUUUUUUU",
    ],
  },
  {
    title: "A cozy house",
    bands: ["7-9", "10-12"],
    palette: {
      R: { name: "Red", hex: "#d6322f" },
      T: { name: "Yellow", hex: "#f5cd2f" },
      W: { name: "Sky blue", hex: "#8cc8ee" },
      B: { name: "Brown", hex: "#8a5a2b" },
    },
    rows: [
      ".....RR.....",
      "....RRRR....",
      "...RRRRRR...",
      "..RRRRRRRR..",
      ".RRRRRRRRRR.",
      "RRRRRRRRRRRR",
      ".TTTTTTTTTT.",
      ".TWWTTTTWWT.",
      ".TWWTTTTWWT.",
      ".TTTTBBTTTT.",
      ".TTTTBBTTTT.",
      ".TTTTBBTTTT.",
    ],
  },
];

export function generateColorByNumber(seed: number, band: AgeBand): ColorByNumberData {
  const rng = mulberry32(seed);
  const pool = SPRITES.filter((s) => s.bands.includes(band));
  const sprite = pick(rng, pool.length ? pool : SPRITES);
  // Numbers follow the order colors first appear, top-left to bottom-right.
  const order: string[] = [];
  for (const row of sprite.rows) for (const ch of row) if (ch !== "." && !order.includes(ch)) order.push(ch);
  const cells = sprite.rows.map((row) =>
    [...row].map((ch) => (ch === "." ? 0 : order.indexOf(ch) + 1)),
  );
  const palette = order.map((ch, i) => ({ n: i + 1, ...sprite.palette[ch] }));
  return {
    cols: sprite.rows[0].length,
    rows: sprite.rows.length,
    cells,
    palette,
    caption: `Color by number: ${sprite.title.toLowerCase()}.`,
  };
}

export function colorByNumberToSvg(data: ColorByNumberData, opts: { maxWidth?: number } = {}): string {
  const { cols, rows, cells, palette } = data;
  const maxW = opts.maxWidth ?? 340;
  const cell = Math.floor(maxW / cols);
  const pad = 4;
  const gridW = cols * cell;
  const gridH = rows * cell;
  const font = Math.max(9, Math.floor(cell * 0.5));
  const parts: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const n = cells[r][c];
      if (!n) continue;
      const x = pad + c * cell;
      const y = pad + r * cell;
      parts.push(
        `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="none" stroke="#1c1915" stroke-width="1"/>`,
        `<text x="${x + cell / 2}" y="${y + cell / 2 + font * 0.35}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="${font}" font-weight="700" fill="#1c1915">${n}</text>`,
      );
    }
  }
  // Legend: two columns of "n = Color", with a small swatch box.
  const legendTop = pad + gridH + 12;
  const perCol = Math.ceil(palette.length / 2);
  const lineH = 18;
  const colW = gridW / 2;
  palette.forEach((p, i) => {
    const col = Math.floor(i / perCol);
    const row = i % perCol;
    const lx = pad + col * colW;
    const ly = legendTop + row * lineH;
    parts.push(
      `<rect x="${lx}" y="${ly}" width="13" height="13" rx="2" fill="${p.hex}" stroke="#1c1915" stroke-width="1"/>`,
      `<text x="${lx + 20}" y="${ly + 11}" font-family="ui-monospace,Menlo,monospace" font-size="12" font-weight="700" fill="#1c1915">${p.n} = ${p.name}</text>`,
    );
  });
  const w = gridW + pad * 2;
  const h = legendTop + perCol * lineH + 4;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Color by number">${parts.join("")}</svg>`;
}
