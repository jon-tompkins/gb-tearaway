import { NextResponse } from "next/server";
import { generateStrip } from "@/lib/generateStrip";
import { getActiveKid, getSettings, readStore, writeStore } from "@/lib/store";
import { fetchWeather } from "@/lib/weather";

export const runtime = "nodejs";

/**
 * Bump the active kid's content nonce and return a fresh strip preview.
 * Same calendar day + name, different content — for judging quality.
 */
export async function POST() {
  const store = await readStore();
  const kid = await getActiveKid(store);
  if (!kid) {
    return NextResponse.json({ error: "No kid profile" }, { status: 404 });
  }
  const settings = getSettings(store);
  const prev = store.nonceByKid[kid.id] ?? 0;
  const nonce = prev + 1;
  store.nonceByKid = { ...store.nonceByKid, [kid.id]: nonce };
  await writeStore(store);

  let weather;
  if (kid.modules.includes("weather")) {
    weather = await fetchWeather({
      city: settings.weatherCity,
      zip: settings.weatherZip,
      timezone: kid.timezone || settings.timezone,
      ageBand: kid.ageBand,
    });
  }

  const job = generateStrip(kid, settings, { nonce, weather });
  return NextResponse.json(job);
}
