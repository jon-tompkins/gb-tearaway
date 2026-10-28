import { NextResponse } from "next/server";
import { generateStrip } from "@/lib/generateStrip";
import { DEMO_KEY, getActiveKid, getSettings, readStore, savePrintJob } from "@/lib/store";
import { currentUserKey } from "@/lib/userKey";
import { fetchWeather } from "@/lib/weather";
import { gatherDailyNews } from "@/lib/news/daily";
import { gatherDailyHistory } from "@/lib/news/history-live";
import { gatherSports } from "@/lib/sports";
import { gatherTeamNews } from "@/lib/sportsNews";
import { gatherDailyExtras } from "@/lib/content/live-extras";
import { dateISOInZone } from "@/lib/dates";
import {
  ensureKidSlots,
  flattenSlotModules,
} from "@/lib/slots";

export const runtime = "nodejs";

/** Generate & save today's job using the current preview nonce; advance in_order cursors. */
export async function POST() {
  const userKey = await currentUserKey();
  const store = await readStore(userKey);
  const kid = await getActiveKid(store);
  if (!kid) {
    return NextResponse.json({ error: "No kid profile — complete setup first" }, { status: 404 });
  }
  const settings = getSettings(store);
  const nonce = store.nonceByKid[kid.id] ?? 0;
  const kidNorm = ensureKidSlots(kid);
  const pool = flattenSlotModules(kidNorm.slots);

  let weather;
  if (pool.includes("weather")) {
    weather = await fetchWeather({
      city: settings.weatherCity,
      zip: settings.weatherZip,
      timezone: kid.timezone || settings.timezone,
      ageBand: kid.ageBand,
      allowMock: userKey === DEMO_KEY,
    });
  }

  const newsByFeed = await gatherDailyNews(pool, { city: settings.weatherCity });
  const historyLive = await gatherDailyHistory(pool, dateISOInZone(kid.timezone || settings.timezone));
  const sports = pool.includes("sports") ? await gatherSports(kid.sportsTeams ?? []) : undefined;
  const extras = await gatherDailyExtras(pool);
  const sportsNews = pool.includes("sportsnews") ? await gatherTeamNews(kid.sportsTeams ?? []) : undefined;
  // Print uses current cursors (matches what you're looking at)
  const job = generateStrip(kidNorm, settings, { nonce, weather, newsByFeed, historyLive, sports, extras, sportsNews });
  job.status = "queued";
  await savePrintJob(userKey, job);

  // In-order cards rotate by calendar day (see resolveSlotModule), so printing
  // must not also bump the cursor — that would cancel tomorrow's step.

  return NextResponse.json(job);
}
