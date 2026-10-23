import type { AgeBand } from "../types";
import { pick } from "../rng";
import { pickRotating, type RotateKey } from "./rotate";
import { mergeBank } from "./mergeBank";
import { TONGUE_TWISTERS, type TwisterEntry } from "./bank/tongue-twisters";

export interface TwisterItem {
  text: string;
  sound: string;
}

/** Exported for the admin bank view. */
export const TWISTERS: TwisterEntry[] = mergeBank(TONGUE_TWISTERS, (t) => t.text);

const strip = (t: TwisterEntry): TwisterItem => ({ text: t.text, sound: t.sound });

export function pickTwister(band: AgeBand, rng: () => number): TwisterItem {
  const pool = TWISTERS.filter((t) => t.bands.includes(band));
  return strip(pick(rng, pool.length ? pool : TWISTERS));
}

/** Today's twister for a kid: walks the whole age-band bank before repeating. */
export function pickTwisterForDay(band: AgeBand, key: RotateKey): TwisterItem {
  const pool = TWISTERS.filter((t) => t.bands.includes(band));
  return strip(pickRotating(pool.length ? pool : TWISTERS, key, `twister|${band}`));
}

/** The card's copy: the twister, the challenge, and a tally row to tick. */
export function twisterLines(t: TwisterItem, band: AgeBand): string[] {
  const reps = band === "4-6" ? 3 : band === "7-9" ? 5 : 7;
  return [
    t.text,
    `Say it ${reps} times fast without a slip.`,
    `Sound to watch: “${t.sound}”.   Tries:  ☐ ☐ ☐ ☐ ☐`,
  ];
}
