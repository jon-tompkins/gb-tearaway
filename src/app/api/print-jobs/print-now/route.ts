import { NextResponse } from "next/server";
import { generateStrip } from "@/lib/generateStrip";
import { getActiveKid, getSettings, readStore, savePrintJob } from "@/lib/store";
import { fetchWeather } from "@/lib/weather";

export const runtime = "nodejs";

/** Generate & save today's job (deterministic for date + kid name). */
export async function POST() {
  const store = await readStore();
  const kid = await getActiveKid(store);
  if (!kid) {
    return NextResponse.json({ error: "No kid profile — complete setup first" }, { status: 404 });
  }
  const settings = getSettings(store);
  // Same-day reprints match: nonce stays 0 for daily content
  const nonce = 0;

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
  job.status = "queued";
  await savePrintJob(job);
  return NextResponse.json(job);
}
