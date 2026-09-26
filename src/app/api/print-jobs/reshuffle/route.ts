import { NextResponse } from "next/server";
import { generateStrip } from "@/lib/generateStrip";
import { getActiveKid, getSettings, readStore, writeStore } from "@/lib/store";
import { currentUserKey } from "@/lib/userKey";
import { fetchWeather } from "@/lib/weather";
import { gatherDailyNews } from "@/lib/news/daily";
import { gatherDailyHistory } from "@/lib/news/history-live";
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
  store.nonceByKid = { ...store.nonceByKid, [kid.id]: nonce };

  const kidNorm = ensureKidSlots(kid);
  const pool = flattenSlotModules(kidNorm.slots);

  let weather;
  if (pool.includes("weather")) {
    weather = await fetchWeather({
      city: settings.weatherCity,
      zip: settings.weatherZip,
      timezone: kid.timezone || settings.timezone,
      ageBand: kid.ageBand,
    });
  }

  const newsByFeed = await gatherDailyNews(pool);
  const historyLive = await gatherDailyHistory(pool, dateISOInZone(kid.timezone || settings.timezone));
  // Generate with current cursors (matches prior preview's slot picks + new nonce)
  const job = generateStrip(kidNorm, settings, { nonce, weather, newsByFeed, historyLive });

  // Persist nonce + advanced in_order cursors
  const idx = store.kids.findIndex((k) => k.id === kid.id);
  if (idx >= 0) {
    store.kids[idx] = {
      ...kidNorm,
      slots: advanceInOrderCursors(kidNorm.slots),
    };
  }
  await writeStore(userKey, store);

  return NextResponse.json(job);
}
