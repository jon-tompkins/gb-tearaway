import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateStrip } from "@/lib/generateStrip";
import { getActiveKid, getSettings, readStore } from "@/lib/store";
import { currentUserKey } from "@/lib/userKey";
import { fetchWeather } from "@/lib/weather";
import { fetchGoogleCalendarEvents } from "@/lib/googleCalendar";
import { gatherDailyNews } from "@/lib/news/daily";
import { gatherDailyHistory } from "@/lib/news/history-live";
import { dateISOInZone } from "@/lib/dates";
import { ensureKidSlots, flattenSlotModules } from "@/lib/slots";
import type { CalendarEvent } from "@/lib/types";

export const runtime = "nodejs";

/** Generate today's strip for dashboard preview (does not persist / does not advance cursors). */
export async function GET() {
  const store = await readStore(await currentUserKey());
  const kid = await getActiveKid(store);
  if (!kid) {
    return NextResponse.json({ error: "No kid profile" }, { status: 404 });
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
    });
  }

  // Pull the parent-selected Google calendar when signed in; else manual events.
  let events: CalendarEvent[] | undefined;
  if (pool.includes("calendar") && kidNorm.calendarId) {
    const session = await auth();
    const accessToken = (session as { accessToken?: string } | null)?.accessToken;
    if (accessToken) {
      try {
        events = await fetchGoogleCalendarEvents(accessToken, {
          calendarId: kidNorm.calendarId,
          days: 2,
        });
      } catch {
        // fall back to manual kid.events
      }
    }
  }

  const newsByFeed = await gatherDailyNews(pool);
  const historyLive = await gatherDailyHistory(pool, dateISOInZone(kid.timezone || settings.timezone));
  const job = generateStrip(kidNorm, settings, { nonce, weather, events, newsByFeed, historyLive });
  return NextResponse.json(job);
}
