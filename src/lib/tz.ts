import { DEFAULT_SETTINGS } from "./types";

/** The browser's IANA timezone (falls back to the app default on the server / old browsers). */
export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_SETTINGS.timezone;
  } catch {
    return DEFAULT_SETTINGS.timezone;
  }
}

const FALLBACK_ZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Phoenix", "America/Los_Angeles",
  "America/Anchorage", "Pacific/Honolulu", "America/Toronto", "America/Vancouver", "America/Mexico_City",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore",
  "Asia/Tokyo", "Australia/Sydney", "Pacific/Auckland",
];

/** All selectable timezones, always including `current`. */
export function timezoneOptions(current?: string): string[] {
  let all: string[] = FALLBACK_ZONES;
  try {
    const fn = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
    if (fn) all = fn("timeZone");
  } catch {
    /* use fallback */
  }
  return current && !all.includes(current) ? [current, ...all] : all;
}
