import type { CalendarEvent } from "./types";

/**
 * Read-only Google Calendar pull. Given a user's OAuth access token (captured
 * in auth.ts), fetch upcoming events from their primary calendar and normalize
 * them into our CalendarEvent shape.
 *
 * Requires the `calendar.readonly` scope on the sign-in (see src/auth.ts).
 */
interface GoogleEvent {
  id?: string;
  summary?: string;
  start?: { date?: string; dateTime?: string };
}

export async function fetchGoogleCalendarEvents(
  accessToken: string,
  opts: { maxResults?: number; days?: number } = {},
): Promise<CalendarEvent[]> {
  const maxResults = opts.maxResults ?? 10;
  const days = opts.days ?? 7;
  const now = new Date();
  const timeMin = now.toISOString();
  const timeMax = new Date(now.getTime() + days * 86_400_000).toISOString();

  const url = new URL(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
  );
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", String(maxResults));

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    // Never cache a user's calendar.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Google Calendar ${res.status}`);
  }
  const data = (await res.json()) as { items?: GoogleEvent[] };
  const items = data.items ?? [];

  return items.map((ev, i): CalendarEvent => {
    const dateTime = ev.start?.dateTime;
    const dateOnly = ev.start?.date;
    // All-day events use `date`; timed events use `dateTime`.
    const iso = dateTime ?? dateOnly ?? "";
    const date = iso.slice(0, 10);
    const time = dateTime
      ? new Date(dateTime).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })
      : undefined;
    return {
      id: ev.id ?? `gcal-${i}`,
      title: ev.summary ?? "(busy)",
      date,
      time,
    };
  });
}
