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

export interface GoogleCalendarInfo {
  id: string;
  summary: string;
  primary: boolean;
}

/** List the calendars the signed-in parent can see (their own + shared-with-them). */
export async function fetchCalendarList(accessToken: string): Promise<GoogleCalendarInfo[]> {
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader",
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
  );
  if (!res.ok) throw new Error(`Google Calendar list ${res.status}`);
  const data = (await res.json()) as {
    items?: { id?: string; summary?: string; summaryOverride?: string; primary?: boolean }[];
  };
  return (data.items ?? [])
    .filter((c) => c.id)
    .map((c) => ({
      id: c.id!,
      summary: c.summaryOverride || c.summary || c.id!,
      primary: !!c.primary,
    }));
}

export async function fetchGoogleCalendarEvents(
  accessToken: string,
  opts: { maxResults?: number; days?: number; calendarId?: string } = {},
): Promise<CalendarEvent[]> {
  const maxResults = opts.maxResults ?? 10;
  const days = opts.days ?? 7;
  const calendarId = opts.calendarId || "primary";
  const now = new Date();
  const timeMin = now.toISOString();
  const timeMax = new Date(now.getTime() + days * 86_400_000).toISOString();

  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
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
