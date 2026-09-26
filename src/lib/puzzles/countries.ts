import { COUNTRIES, type CountryShape } from "./countries-data";
import { clampDifficulty } from "../difficulty";

type RNG = () => number;
export type Continent = CountryShape["continent"];

export interface CountryQuiz {
  name: string;
  capital: string;
  /** Easy = country named + capital starred on the card. Hard = blank outline. */
  easy: boolean;
  svg: string;
  answer: string;
}

function locationPhrase(s: CountryShape): string {
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

export function countryToSvg(s: CountryShape, opts: { showStar?: boolean } = {}): string {
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s.w} ${s.h}" width="${s.w}" height="${s.h}" role="img" aria-label="Country outline">`,
    `<path d="${s.path}" fill="#f2efe8" stroke="#111" stroke-width="2" stroke-linejoin="round"/>`,
  ];
  if (opts.showStar) parts.push(star(s.star[0], s.star[1]));
  parts.push("</svg>");
  return parts.join("");
}

export function generateCountryQuiz(rng: RNG, difficulty: number, continent: Continent): CountryQuiz {
  const pool = COUNTRIES.filter((c) => c.continent === continent);
  const easy = clampDifficulty(difficulty) <= 8;
  const s = pool[Math.floor(rng() * pool.length) % pool.length];
  return {
    name: s.name,
    capital: s.capital,
    easy,
    svg: countryToSvg(s, { showStar: easy }),
    answer: `${s.name} — capital: ${s.capital} (${locationPhrase(s)})`,
  };
}
