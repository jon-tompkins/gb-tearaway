import type { AgeBand } from "../types";
import { pick } from "../rng";
import { pickRotating, type RotateKey } from "./rotate";
import { CRYPTOGRAMS } from "./bank/cryptograms";

const poolFor = (band: AgeBand) => {
  const p = CRYPTOGRAMS.filter((c) => c.bands.includes(band));
  return p.length ? p : CRYPTOGRAMS;
};

export function pickCryptogram(band: AgeBand, rng: () => number): string {
  return pick(rng, poolFor(band)).text;
}

/** Today's message for a kid: walks the whole age-band bank before repeating. */
export function pickCryptogramForDay(band: AgeBand, key: RotateKey): string {
  return pickRotating(poolFor(band), key, `cryptogram|${band}`).text;
}
