import { generateStrip } from "./generateStrip";
import { getSettings, readStore } from "./store";
import { fetchWeather } from "./weather";
import type { KidProfile, PrintJob } from "./types";

export async function buildJobForKid(
  kid: KidProfile,
  opts: { dateISO?: string; nonce?: number; persistStatus?: PrintJob["status"] } = {},
): Promise<PrintJob> {
  const store = await readStore();
  const settings = getSettings(store);
  const nonce = opts.nonce ?? store.nonceByKid[kid.id] ?? 0;

  let weather;
  if (kid.modules.includes("weather")) {
    weather = await fetchWeather({
      city: settings.weatherCity,
      zip: settings.weatherZip,
      timezone: kid.timezone || settings.timezone,
      ageBand: kid.ageBand,
    });
  }

  const job = generateStrip(kid, settings, {
    nonce,
    weather,
    dateISO: opts.dateISO,
  });
  if (opts.persistStatus) job.status = opts.persistStatus;
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
