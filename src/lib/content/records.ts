import type { AgeBand } from "../types";
import { pick } from "../rng";
import { pickRotating, type RotateKey } from "./rotate";
import { mergeBank } from "./mergeBank";
import { RECORDS_NATURE } from "./bank/records-nature";
import { RECORDS_PEOPLE } from "./bank/records-people";

export interface RecordItem {
  category: string;
  record: string;
  extra: string;
}

interface RecordEntry extends RecordItem {
  bands: AgeBand[];
}

/** Real, current world records — nature/space plus people, sports and feats. */
export const RECORDS: RecordEntry[] = mergeBank([...RECORDS_NATURE, ...RECORDS_PEOPLE], (r) => r.record);

const strip = (r: RecordEntry): RecordItem => ({ category: r.category, record: r.record, extra: r.extra });

export function pickRecord(band: AgeBand, rng: () => number): RecordItem {
  const pool = RECORDS.filter((r) => r.bands.includes(band));
  return strip(pick(rng, pool.length ? pool : RECORDS));
}

/** Today's record for a kid: walks the whole bank for their age band before repeating. */
export function pickRecordForDay(band: AgeBand, key: RotateKey): RecordItem {
  const pool = RECORDS.filter((r) => r.bands.includes(band));
  return strip(pickRotating(pool.length ? pool : RECORDS, key, `records|${band}`));
}
