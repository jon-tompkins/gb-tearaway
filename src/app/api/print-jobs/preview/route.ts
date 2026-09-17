import { NextResponse } from "next/server";
import { generateStrip } from "@/lib/generateStrip";
import { getActiveKid, getSettings, readStore } from "@/lib/store";
import { fetchWeather } from "@/lib/weather";
import { ensureKidSlots, flattenSlotModules } from "@/lib/slots";

export const runtime = "nodejs";

/** Generate today's strip for dashboard preview (does not persist / does not advance cursors). */
export async function GET() {
  const store = await readStore();
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

  const job = generateStrip(kidNorm, settings, { nonce, weather });
  return NextResponse.json(job);
}
