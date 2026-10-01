import { generateStrip } from "./generateStrip";
import { DEMO_KEY, getSettings, readStore, writeStore } from "./store";
import { fetchWeather } from "./weather";
import { gatherDailyNews } from "./news/daily";
import { gatherDailyExtras } from "./content/live-extras";
import { gatherDailyHistory } from "./news/history-live";
import { gatherSports } from "./sports";
import { dateISOInZone } from "./dates";
import type { KidProfile, PrintJob } from "./types";
import {
  advanceInOrderCursors,
  ensureKidSlots,
  flattenSlotModules,
} from "./slots";

export async function buildJobForKid(
  kid: KidProfile,
  opts: {
    dateISO?: string;
    nonce?: number;
    persistStatus?: PrintJob["status"];
    /** Advance in_order cursors after this generate (reshuffle / print). */
    advanceCursors?: boolean;
    /** Which user's store to read/write (defaults to the shared demo store). */
    userKey?: string;
  } = {},
): Promise<PrintJob> {
  const userKey = opts.userKey ?? DEMO_KEY;
  const store = await readStore(userKey);
  const settings = getSettings(store);
  const nonce = opts.nonce ?? store.nonceByKid[kid.id] ?? 0;
  const kidNorm = ensureKidSlots(kid);
  const pool = flattenSlotModules(kidNorm.slots);

  // Fetch every live source in parallel — these are independent and otherwise
  // add up (weather + news RSS + Wikimedia history + sports + 6 Haiku content
  // calls). Serial awaits here pushed the uncached morning render past the PDF
  // render timeout, dropping the emailed attachment.
  const [weather, newsByFeed, historyLive, sports, extras] = await Promise.all([
    pool.includes("weather")
      ? fetchWeather({
          city: settings.weatherCity,
          zip: settings.weatherZip,
          timezone: kid.timezone || settings.timezone,
          ageBand: kid.ageBand,
        })
      : Promise.resolve(undefined),
    gatherDailyNews(pool, { city: settings.weatherCity }),
    gatherDailyHistory(pool, opts.dateISO ?? dateISOInZone(kid.timezone || settings.timezone)),
    pool.includes("sports") ? gatherSports(kid.sportsTeams ?? []) : Promise.resolve(undefined),
    gatherDailyExtras(pool),
  ]);

  const job = generateStrip(kidNorm, settings, {
    nonce,
    weather,
    dateISO: opts.dateISO,
    newsByFeed,
    historyLive,
    sports,
    extras,
  });
  if (opts.persistStatus) job.status = opts.persistStatus;

  if (opts.advanceCursors) {
    const idx = store.kids.findIndex((k) => k.id === kid.id);
    if (idx >= 0) {
      store.kids[idx] = {
        ...store.kids[idx],
        slots: advanceInOrderCursors(store.kids[idx].slots),
      };
      await writeStore(userKey, store);
    }
  }

  return job;
}

export function estimateJobHeight(job: PrintJob): number {
  let h = 120;
  for (const s of job.sections) {
    if (s.kind === "header") h += 90;
    else if (s.kind === "footer") h += 70;
    else if (s.kind === "maze" && s.maze) {
      h += 40 + Math.floor(352 / s.maze.cols) * s.maze.rows + 24;
    } else if (s.kind === "sudoku" && s.sudoku) {
      const cell = s.sudoku.size >= 9 ? 32 : s.sudoku.size >= 6 ? 36 : 44;
      h += 52 + s.sudoku.size * cell + 36;
    } else {
      h += 28 + s.lines.length * 22 + 16;
    }
  }
  return Math.min(Math.max(h, 420), 4096);
}
