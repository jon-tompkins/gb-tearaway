import { NextResponse } from "next/server";
import { readStore, getActiveKid, getSettings } from "@/lib/store";
import { fetchWeather } from "@/lib/weather";
import type { AgeBand } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const store = await readStore();
  const kid = await getActiveKid(store);
  const settings = getSettings(store);

  const city = url.searchParams.get("city") || settings.weatherCity;
  const zip = url.searchParams.get("zip") || settings.weatherZip;
  const tz = url.searchParams.get("tz") || settings.timezone;
  const age = (url.searchParams.get("age") as AgeBand) || kid?.ageBand || "7-9";

  const weather = await fetchWeather({
    city,
    zip,
    timezone: tz,
    ageBand: age,
  });
  return NextResponse.json(weather);
}
