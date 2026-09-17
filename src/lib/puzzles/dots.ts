import type { AgeBand, DotsData } from "../types";
import { mulberry32, pick } from "../rng";

interface Shape {
  caption: string;
  bands: AgeBand[];
  /** Relative 0–1 coordinates, clockwise-ish for a silly silhouette. */
  pts: [number, number][];
}

const SHAPES: Shape[] = [
  {
    bands: ["4-6"],
    caption: "Connect the dots: a wobbly banana phone.",
    pts: [
      [0.2, 0.3],
      [0.35, 0.18],
      [0.55, 0.15],
      [0.75, 0.28],
      [0.82, 0.5],
      [0.7, 0.72],
      [0.48, 0.8],
      [0.28, 0.68],
      [0.18, 0.48],
    ],
  },
  {
    bands: ["4-6", "7-9"],
    caption: "Connect the dots: a rocket that smells like toast.",
    pts: [
      [0.5, 0.08],
      [0.68, 0.28],
      [0.7, 0.55],
      [0.82, 0.78],
      [0.5, 0.68],
      [0.18, 0.78],
      [0.3, 0.55],
      [0.32, 0.28],
    ],
  },
  {
    bands: ["4-6"],
    caption: "Connect the dots: a cat who is also a cloud.",
    pts: [
      [0.18, 0.45],
      [0.28, 0.22],
      [0.42, 0.18],
      [0.55, 0.28],
      [0.7, 0.2],
      [0.85, 0.38],
      [0.8, 0.62],
      [0.58, 0.78],
      [0.32, 0.75],
      [0.15, 0.58],
    ],
  },
  {
    bands: ["4-6", "7-9"],
    caption: "Connect the dots: a smiling slice of pizza.",
    pts: [
      [0.5, 0.12],
      [0.22, 0.78],
      [0.38, 0.82],
      [0.5, 0.7],
      [0.62, 0.82],
      [0.78, 0.78],
    ],
  },
  {
    bands: ["7-9"],
    caption: "Connect the dots: a snail delivering mail.",
    pts: [
      [0.18, 0.72],
      [0.3, 0.55],
      [0.28, 0.35],
      [0.42, 0.22],
      [0.6, 0.28],
      [0.68, 0.48],
      [0.58, 0.62],
      [0.78, 0.7],
      [0.55, 0.82],
      [0.32, 0.82],
    ],
  },
  {
    bands: ["7-9", "10-12"],
    caption: "Connect the dots: a teapot that thinks it’s a submarine.",
    pts: [
      [0.22, 0.42],
      [0.18, 0.28],
      [0.32, 0.2],
      [0.55, 0.18],
      [0.72, 0.28],
      [0.78, 0.48],
      [0.7, 0.68],
      [0.48, 0.78],
      [0.28, 0.7],
      [0.2, 0.55],
      [0.88, 0.4],
    ],
  },
  {
    bands: ["7-9", "10-12"],
    caption: "Connect the dots: a dinosaur wearing rain boots.",
    pts: [
      [0.15, 0.55],
      [0.28, 0.32],
      [0.42, 0.18],
      [0.55, 0.28],
      [0.7, 0.22],
      [0.82, 0.38],
      [0.78, 0.58],
      [0.68, 0.78],
      [0.52, 0.7],
      [0.38, 0.8],
      [0.22, 0.72],
    ],
  },
  {
    bands: ["10-12"],
    caption: "Connect the dots: a tiny bridge between cereal boxes.",
    pts: [
      [0.12, 0.78],
      [0.12, 0.32],
      [0.28, 0.32],
      [0.28, 0.55],
      [0.72, 0.55],
      [0.72, 0.32],
      [0.88, 0.32],
      [0.88, 0.78],
      [0.72, 0.78],
      [0.28, 0.78],
    ],
  },
  {
    bands: ["10-12"],
    caption: "Connect the dots: a robot whose only job is making toast.",
    pts: [
      [0.35, 0.12],
      [0.65, 0.12],
      [0.72, 0.28],
      [0.78, 0.5],
      [0.7, 0.72],
      [0.55, 0.85],
      [0.45, 0.85],
      [0.3, 0.72],
      [0.22, 0.5],
      [0.28, 0.28],
    ],
  },
  {
    bands: ["4-6", "7-9", "10-12"],
    caption: "Connect the dots: a star that forgot one point.",
    pts: [
      [0.5, 0.1],
      [0.6, 0.38],
      [0.88, 0.38],
      [0.66, 0.55],
      [0.75, 0.85],
      [0.5, 0.68],
      [0.25, 0.85],
      [0.34, 0.55],
      [0.12, 0.38],
    ],
  },
  {
    bands: ["4-6"],
    caption: "Connect the dots: a fish in rain boots.",
    pts: [
      [0.15, 0.5],
      [0.32, 0.28],
      [0.55, 0.22],
      [0.78, 0.4],
      [0.82, 0.58],
      [0.7, 0.75],
      [0.48, 0.78],
      [0.28, 0.68],
    ],
  },
  {
    bands: ["7-9"],
    caption: "Connect the dots: a house that could float.",
    pts: [
      [0.5, 0.12],
      [0.82, 0.4],
      [0.82, 0.72],
      [0.18, 0.72],
      [0.18, 0.4],
    ],
  },
];

function jitter(rng: () => number, v: number, amount: number): number {
  return Math.min(0.92, Math.max(0.08, v + (rng() - 0.5) * amount));
}

export function generateDots(seed: number, band: AgeBand): DotsData {
  const rng = mulberry32(seed);
  const pool = SHAPES.filter((s) => s.bands.includes(band));
  const shape = pick(rng, pool.length ? pool : SHAPES);
  const amount = band === "4-6" ? 0.04 : 0.06;
  const points = shape.pts.map((pt, i) => ({
    n: i + 1,
    x: jitter(rng, pt[0], amount),
    y: jitter(rng, pt[1], amount),
  }));
  return { points, caption: shape.caption, size: 320 };
}

export function dotsToSvg(data: DotsData): string {
  const size = data.size;
  const dots = data.points
    .map((p) => {
      const x = p.x * size;
      const y = p.y * size;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="#1c1915"/>
        <text x="${(x + 8).toFixed(1)}" y="${(y - 6).toFixed(1)}" font-family="ui-monospace,Menlo,monospace" font-size="11" font-weight="700" fill="#1c1915">${p.n}</text>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${Math.min(size, 280)}" role="img" aria-label="Connect the dots">${dots}</svg>`;
}
