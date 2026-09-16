import type { CalendarEvent } from "../types";
import { addDaysISO, dateISOInZone, formatTime12 } from "../dates";

export function defaultDemoEvents(timezone: string, kidName: string): CalendarEvent[] {
  const today = dateISOInZone(timezone);
  return [
    { id: "evt_soccer", title: `${kidName}'s soccer practice`, date: today, time: "16:30" },
    { id: "evt_library", title: "Library books due", date: addDaysISO(today, 1) },
    { id: "evt_grandma", title: "Call Grandma", date: addDaysISO(today, 2), time: "18:00" },
  ];
}

export function eventsForToday(events: CalendarEvent[], dateISO: string): CalendarEvent[] {
  return events.filter((e) => e.date === dateISO);
}

export function formatEventLine(e: CalendarEvent): string {
  if (e.time) return `${formatTime12(e.time)} · ${e.title}`;
  return e.title;
}
