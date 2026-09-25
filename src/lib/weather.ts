import type { AgeBand, WeatherDay, WeatherPeriod, WeatherSnapshot } from "./types";

const WMO: Record<number, string> = {
  0: "clear skies",
  1: "mostly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "fog",
  48: "rime fog",
  51: "light drizzle",
  53: "drizzle",
  55: "heavy drizzle",
  61: "light rain",
  63: "rain",
  65: "heavy rain",
  71: "light snow",
  73: "snow",
  75: "heavy snow",
  80: "rain showers",
  81: "rain showers",
  82: "strong rain showers",
  95: "thunderstorms",
  96: "thunderstorms with hail",
  99: "thunderstorms with hail",
};

function tipFor(code: number, high: number | null, age: AgeBand): string {
  const cold = high != null && high <= 45;
  const hot = high != null && high >= 85;
  if ([61, 63, 65, 80, 81, 82, 51, 53, 55].includes(code)) {
    return age === "4-6"
      ? "Raincoat day. Stomp a shallow puddle."
      : "Pack a rain layer. Streets will shine.";
  }
  if ([71, 73, 75, 85, 86].includes(code)) {
    return age === "4-6"
      ? "Snow math: boots + mittens = yes."
      : "If it sticks, claim first-boot-print privilege.";
  }
  if ([95, 96, 99].includes(code)) {
    return "Thunder means inside games. Count seconds after lightning.";
  }
  if (cold) {
    return age === "4-6"
      ? "Bundle up. Cold noses still need breakfast."
      : "Layers beat one huge coat.";
  }
  if (hot) return "Water bottle. Shade if you can. Hats help.";
  if (code === 0 || code === 1) return "A bright one. Notice one shadow on the way out.";
  return "Look up before you zip the backpack.";
}

/** Stable hash for demo weather when live APIs are unavailable. */
function hashPlace(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const PERIOD_HOURS: [string, string][] = [
  ["Morning", "09:00"],
  ["Afternoon", "14:00"],
  ["Evening", "18:00"],
];

function weekdayShort(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { weekday: "short" });
}

function buildPeriods(
  hourly:
    | { time?: string[]; temperature_2m?: number[]; weather_code?: number[]; precipitation_probability?: number[] }
    | undefined,
  today: string | undefined,
): WeatherPeriod[] | undefined {
  if (!hourly?.time || !today) return undefined;
  const out: WeatherPeriod[] = [];
  for (const [label, hh] of PERIOD_HOURS) {
    const i = hourly.time.indexOf(`${today}T${hh}`);
    if (i < 0) continue;
    const t = hourly.temperature_2m?.[i];
    const pp = hourly.precipitation_probability?.[i];
    out.push({
      label,
      code: hourly.weather_code?.[i] ?? 1,
      tempF: t != null ? Math.round(t) : null,
      precip: pp != null ? Math.round(pp) : null,
    });
  }
  return out.length ? out : undefined;
}

function buildDaily(daily: {
  time?: string[];
  weather_code?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_probability_max?: number[];
}): WeatherDay[] | undefined {
  if (!daily?.time) return undefined;
  const out = daily.time.slice(0, 7).map((d, i) => ({
    day: weekdayShort(d),
    code: daily.weather_code?.[i] ?? 1,
    hi: daily.temperature_2m_max?.[i] != null ? Math.round(daily.temperature_2m_max![i]) : null,
    lo: daily.temperature_2m_min?.[i] != null ? Math.round(daily.temperature_2m_min![i]) : null,
    precip: daily.precipitation_probability_max?.[i] != null
      ? Math.round(daily.precipitation_probability_max![i])
      : null,
  }));
  return out.length ? out : undefined;
}

/** Plausible precip% for a WMO code (drizzle/rain/snow/storm → higher). */
function mockPrecip(code: number, salt: number): number {
  if (code >= 95) return 70 + (salt % 25);
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 55 + (salt % 35);
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 50 + (salt % 30);
  if (code === 3) return 20 + (salt % 20);
  if (code === 2) return 10 + (salt % 15);
  return salt % 10;
}

function mockPeriods(base: number, code: number): WeatherPeriod[] {
  return [
    { label: "Morning", code, tempF: base - 5, precip: mockPrecip(code, 3) },
    { label: "Afternoon", code, tempF: base + 4, precip: mockPrecip(code, 7) },
    { label: "Evening", code, tempF: base - 2, precip: mockPrecip(code, 5) },
  ];
}
function mockDaily(h: number, base: number): WeatherDay[] {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const codes = [0, 1, 2, 3, 61, 80, 2];
  const start = new Date().getDay();
  return Array.from({ length: 7 }, (_, i) => {
    const code = codes[(h + i) % codes.length];
    return {
      day: names[(start + i) % 7],
      code,
      hi: base + 4 + ((h >> i) % 6),
      lo: base - 6 - ((h >> (i + 1)) % 4),
      precip: mockPrecip(code, (h >> i) & 31),
    };
  });
}

/**
 * Offline / rate-limit fallback. Still returns plausible temps so the strip
 * looks like a real morning paper in demos.
 */
export function mockWeather(age: AgeBand, place: string): WeatherSnapshot {
  const label = place || "home";
  const h = hashPlace(label.toLowerCase());
  const skies = [
    { code: 0, summary: "clear skies" },
    { code: 1, summary: "mostly clear" },
    { code: 2, summary: "partly cloudy" },
    { code: 3, summary: "overcast" },
    { code: 61, summary: "light rain" },
  ];
  const sky = skies[h % skies.length];
  const base = 52 + (h % 28);
  const tempF = base + ((h >> 3) % 7) - 3;
  const highF = tempF + 4 + ((h >> 5) % 5);
  const lowF = tempF - 6 - ((h >> 7) % 4);
  const tip = tipFor(sky.code, highF, age);

  return {
    label,
    summary:
      age === "4-6"
        ? `${label}: ${sky.summary}, about ${tempF}°F right now.`
        : `${label} — ${sky.summary}, ${tempF}°F now. High ${highF}° / low ${lowF}°.`,
    tempF,
    highF,
    lowF,
    tip: `${tip} (demo forecast)`,
    source: "mock",
    code: sky.code,
    periods: mockPeriods(tempF, sky.code),
    daily: mockDaily(h, base),
  };
}

interface Geo {
  name: string;
  latitude: number;
  longitude: number;
}

async function geocodeZip(zip: string): Promise<Geo | null> {
  const clean = zip.trim().slice(0, 10);
  if (!/^\d{5}(-\d{4})?$/.test(clean)) return null;
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${clean.slice(0, 5)}`, {
      next: { revalidate: 86400 * 30 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      places?: {
        latitude: string;
        longitude: string;
        "place name": string;
        "state abbreviation": string;
      }[];
    };
    const p = json.places?.[0];
    if (!p) return null;
    return {
      name: `${p["place name"]}, ${p["state abbreviation"]}`,
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
    };
  } catch {
    return null;
  }
}

async function geocodeCity(city: string): Promise<Geo | null> {
  const q = city.trim();
  if (q.length < 2) return null;
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`;
    const res = await fetch(url, { next: { revalidate: 86400 * 7 } });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      results?: {
        name: string;
        admin1?: string;
        country_code?: string;
        latitude: number;
        longitude: number;
      }[];
    };
    const r = json.results?.[0];
    if (!r) return null;
    const bits = [r.name, r.admin1, r.country_code].filter(Boolean);
    return { name: bits.join(", "), latitude: r.latitude, longitude: r.longitude };
  } catch {
    return null;
  }
}

export async function fetchWeather(opts: {
  zip?: string;
  city?: string;
  timezone?: string;
  ageBand?: AgeBand;
}): Promise<WeatherSnapshot> {
  const age = opts.ageBand ?? "7-9";
  const placeGuess = (opts.city || opts.zip || "home").trim();
  try {
    const geo =
      (opts.zip?.trim() ? await geocodeZip(opts.zip) : null) ||
      (opts.city?.trim() ? await geocodeCity(opts.city) : null);
    if (!geo) return mockWeather(age, placeGuess);

    const params = new URLSearchParams({
      latitude: String(geo.latitude),
      longitude: String(geo.longitude),
      current: "temperature_2m,weather_code",
      hourly: "temperature_2m,weather_code,precipitation_probability",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
      temperature_unit: "fahrenheit",
      timezone: opts.timezone || "America/New_York",
      forecast_days: "7",
    });
    // Cache ~30m so parent preview refreshes don't burn Open-Meteo quota.
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return mockWeather(age, geo.name);
    const json = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
      hourly?: {
        time?: string[];
        temperature_2m?: number[];
        weather_code?: number[];
        precipitation_probability?: number[];
      };
      daily?: {
        time?: string[];
        weather_code?: number[];
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        precipitation_probability_max?: number[];
      };
      error?: boolean;
    };
    if (json.error) return mockWeather(age, geo.name);
    const periods = buildPeriods(json.hourly, json.daily?.time?.[0]);
    const daily = buildDaily(json.daily ?? {});

    const code = json.current?.weather_code ?? json.daily?.weather_code?.[0] ?? 1;
    const now = json.current?.temperature_2m ?? null;
    const high = json.daily?.temperature_2m_max?.[0] ?? null;
    const low = json.daily?.temperature_2m_min?.[0] ?? null;
    const sky = WMO[code] ?? "interesting weather";
    const n = now != null ? `${Math.round(now)}°F` : "";
    const range =
      high != null && low != null
        ? `High ${Math.round(high)}° / low ${Math.round(low)}°`
        : "";
    const summary =
      age === "4-6"
        ? `${geo.name}: ${sky}${n ? `, about ${n} right now` : ""}.`
        : `${geo.name} — ${sky}${n ? `, ${n} now` : ""}. ${range}`.trim();

    return {
      label: geo.name,
      summary,
      tempF: now != null ? Math.round(now) : null,
      highF: high != null ? Math.round(high) : null,
      lowF: low != null ? Math.round(low) : null,
      tip: tipFor(code, high, age),
      source: "open-meteo",
      code,
      periods,
      daily,
    };
  } catch {
    return mockWeather(age, placeGuess);
  }
}
