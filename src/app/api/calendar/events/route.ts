import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchGoogleCalendarEvents } from "@/lib/googleCalendar";

/**
 * Upcoming events for the signed-in parent's primary Google Calendar.
 * Returns `{ connected: false }` when signed out or no token — callers fall
 * back to manually-entered kid events.
 */
export async function GET(req: Request) {
  const session = await auth();
  const accessToken = (session as { accessToken?: string } | null)?.accessToken;
  if (!accessToken) {
    return NextResponse.json({ connected: false, events: [] });
  }
  const calendarId = new URL(req.url).searchParams.get("calendarId") || undefined;
  try {
    const events = await fetchGoogleCalendarEvents(accessToken, {
      days: 7,
      maxResults: 10,
      calendarId,
    });
    return NextResponse.json({ connected: true, events });
  } catch (e) {
    return NextResponse.json(
      { connected: false, events: [], error: e instanceof Error ? e.message : "calendar error" },
      { status: 200 },
    );
  }
}
