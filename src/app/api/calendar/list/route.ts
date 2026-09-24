import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchCalendarList } from "@/lib/googleCalendar";

/**
 * Calendars the signed-in parent can read (their own + any shared with them,
 * e.g. the kid's). The parent picks one per dispatch for the calendar module.
 * Returns `{ connected: false, calendars: [] }` when signed out.
 */
export async function GET() {
  const session = await auth();
  const accessToken = (session as { accessToken?: string } | null)?.accessToken;
  if (!accessToken) {
    return NextResponse.json({ connected: false, calendars: [] });
  }
  try {
    const calendars = await fetchCalendarList(accessToken);
    return NextResponse.json({ connected: true, calendars });
  } catch (e) {
    return NextResponse.json(
      { connected: false, calendars: [], error: e instanceof Error ? e.message : "calendar error" },
      { status: 200 },
    );
  }
}
