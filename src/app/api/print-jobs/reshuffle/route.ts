import { NextResponse } from "next/server";
import { generateStrip } from "@/lib/generateStrip";
import { DEMO_KEY, getActiveKid, getSettings, readStore, writeStore } from "@/lib/store";
import { currentUserKey } from "@/lib/userKey";
import { fetchWeather } from "@/lib/weather";
import { gatherDailyNews } from "@/lib/news/daily";
import { gatherDailyHistory } from "@/lib/news/history-live";
import { gatherSports } from "@/lib/sports";
import { gatherTeamNews } from "@/lib/sportsNews";
import { gatherDailyExtras } from "@/lib/content/live-extras";
import { dateISOInZone } from "@/lib/dates";
import {
  advanceInOrderCursors,
  ensureKidSlots,
  flattenSlotModules,
} from "@/lib/slots";

export const runtime = "nodejs";

/**
 * Bump the active kid's content nonce, return a fresh strip using current
 * in_order cursors, then advance those cursors for the next run.
 */
export async function POST() {
  const userKey = await currentUserKey();
  const store = await readStore(userKey);
  const kid = await getActiveKid(store);
  if (!kid) {
    return NextResponse.json({ error: "No kid profile" }, { status: 404 });
  }
  const settings = getSettings(store);
  const prev = store.nonceByKid[kid.id] ?? 0;
  const nonce = prev + 1;

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
  // Generate with current cursors (matches prior preview's slot picks + new nonce)
  const job = generateStrip(kidNorm, settings, { nonce, weather, newsByFeed, historyLive, sports, extras, sportsNews });

  // Persist nonce + advanced in_order cursors on a FRESH copy, so anything the
  // parent saved while this was generating isn't overwritten.
  const fresh = await readStore(userKey);
  fresh.nonceByKid = { ...fresh.nonceByKid, [kid.id]: nonce };
  const idx = fresh.kids.findIndex((k) => k.id === kid.id);
  if (idx >= 0) {
    const fk = ensureKidSlots(fresh.kids[idx]);
    fresh.kids[idx] = { ...fk, slots: advanceInOrderCursors(fk.slots) };
  }
  await writeStore(userKey, fresh);

  return NextResponse.json(job);
}
