import type { AgeBand } from "../types";
import { pick } from "../rng";

export interface WyrItem {
  a: string;
  b: string;
  nudge: string;
}

interface WyrEntry extends WyrItem {
  bands: AgeBand[];
}

const WYRS: WyrEntry[] = [
  { bands: ["4-6"], a: "pancakes every day", b: "waffles every day", nudge: "Pick one — then tell why in one word." },
  { bands: ["4-6"], a: "be able to fly", b: "be able to talk to animals", nudge: "No switching later!" },
  { bands: ["4-6"], a: "a pet dinosaur the size of a cat", b: "a pet cat the size of a dinosaur", nudge: "Think about snacks." },
  { bands: ["4-6"], a: "only whisper for a day", b: "only sing for a day", nudge: "Practice at breakfast." },
  { bands: ["4-6", "7-9"], a: "live in a treehouse", b: "live on a houseboat", nudge: "Where do your books go?" },
  { bands: ["4-6", "7-9"], a: "never have to wait in line", b: "never lose your socks", nudge: "Both are magic." },
  { bands: ["4-6", "7-9"], a: "a backpack that never gets heavy", b: "shoes that never get muddy", nudge: "School-day power-ups." },
  { bands: ["7-9"], a: "explore the ocean in a sub", b: "explore Mars in a rover", nudge: "Pack one snack either way." },
  { bands: ["7-9"], a: "always know what day it is", b: "always know what time it is", nudge: "No phones allowed in this game." },
  { bands: ["7-9", "10-12"], a: "read minds for one hour", b: "turn invisible for one hour", nudge: "Use power for good only." },
  { bands: ["7-9"], a: "a slide from your bedroom to the kitchen", b: "a trampoline hallway", nudge: "Safety first — imagine soft landings." },
  { bands: ["7-9", "10-12"], a: "invent a new holiday", b: "invent a new sport", nudge: "Name it before you choose." },
  { bands: ["10-12"], a: "only eat sweet food for a week", b: "only eat savory food for a week", nudge: "Hydrate either way." },
  { bands: ["10-12"], a: "always be 10 minutes early", b: "always have the perfect comeback… 10 minutes late", nudge: "Timing vs wit." },
  { bands: ["10-12"], a: "write a bestselling comic", b: "direct a short film with friends", nudge: "Same story energy, different tools." },
  { bands: ["10-12"], a: "solve any maze instantly", b: "solve any riddle instantly", nudge: "Which skill helps more at breakfast?" },
  { bands: ["4-6"], a: "rainbow cereal", b: "rainbow socks", nudge: "Color counts." },
  { bands: ["4-6", "7-9"], a: "a robot that cleans your room", b: "a robot that tells jokes", nudge: "Chores vs laughs." },
  { bands: ["7-9"], a: "snow in July", b: "a beach day in January", nudge: "Weather remix." },
  { bands: ["7-9", "10-12"], a: "speak every language", b: "play every instrument", nudge: "Both open doors." },
  { bands: ["4-6"], a: "draw with your toes", b: "write with your elbow", nudge: "Try neither at the table." },
  { bands: ["10-12"], a: "a quiet library forever", b: "a loud stadium forever", nudge: "Where does your brain wake up?" },
  { bands: ["4-6", "7-9"], a: "bubble-wrap floors", b: "pillow walls", nudge: "Home redesign." },
  { bands: ["7-9", "10-12"], a: "never need an umbrella", b: "never need a jacket", nudge: "Climate perk." },
  { bands: ["10-12"], a: "finish every project you start", b: "start only projects you’ll love", nudge: "Discipline vs spark." },
  { bands: ["4-6"], a: "a pocket full of stickers", b: "a pocket full of crumbs (for ducks)", nudge: "Generous either way." },
  { bands: ["7-9"], a: "be team captain", b: "be the team’s secret strategist", nudge: "Lead out loud or behind the scenes." },
  { bands: ["4-6", "7-9"], a: "breakfast for dinner every Friday", b: "dinner for breakfast every Saturday", nudge: "Menu rebellion." },
];

export function pickWyr(band: AgeBand, rng: () => number): WyrItem {
  const pool = WYRS.filter((w) => w.bands.includes(band));
  const w = pick(rng, pool.length ? pool : WYRS);
  return { a: w.a, b: w.b, nudge: w.nudge };
}
