import { US_STATES, type StateShape } from "./states-data";
import { clampDifficulty } from "../difficulty";

type RNG = () => number;

export interface StateQuiz {
  name: string;
  capital: string;
  /** Easy = state named + capital starred on the card. Hard = blank outline. */
  easy: boolean;
  svg: string;
  /** In-app answer (state, capital, roughly where the capital sits). */
  answer: string;
}

/** Coarse "where in the state" phrase from the star's normalized position. */
function locationPhrase(s: StateShape): string {
  const fx = s.star[0] / s.w;
  const fy = s.star[1] / s.h;
  const v = fy < 0.34 ? "north" : fy > 0.66 ? "south" : "";
  const h = fx < 0.34 ? "west" : fx > 0.66 ? "east" : "";
  const combo = v + h || "central";
  return `${combo} ${s.name}`;
}

function star(cx: number, cy: number, r = 9): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.42;
    pts.push(`${(cx + rr * Math.cos(ang)).toFixed(1)},${(cy + rr * Math.sin(ang)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="#c0392b" stroke="#7d1d13" stroke-width="1"/>`;
}

/** Outline (+ optional capital star) sized to its own viewBox. */
export function stateToSvg(s: StateShape, opts: { showStar?: boolean } = {}): string {
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s.w} ${s.h}" width="${s.w}" height="${s.h}" role="img" aria-label="US state outline">`,
    `<path d="${s.path}" fill="#f2efe8" stroke="#111" stroke-width="2" stroke-linejoin="round"/>`,
  ];
  if (opts.showStar) parts.push(star(s.star[0], s.star[1]));
  parts.push("</svg>");
  return parts.join("");
}

export function generateStateQuiz(rng: RNG, difficulty: number): StateQuiz {
  const easy = clampDifficulty(difficulty) <= 8;
  const s = US_STATES[Math.floor(rng() * US_STATES.length) % US_STATES.length];
  return {
    name: s.name,
    capital: s.capital,
    easy,
    svg: stateToSvg(s, { showStar: easy }),
    answer: `${s.name} — capital: ${s.capital} (${locationPhrase(s)})`,
  };
}
