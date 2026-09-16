const WEEKDAYS = [
  "Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday",
];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export function partsInZone(
  timeZone: string,
  at: Date = new Date(),
): { year: number; month: number; day: number; weekday: string; hour: number; minute: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "long",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  });
  const bag: Record<string, string> = {};
  for (const part of fmt.formatToParts(at)) {
    if (part.type !== "literal") bag[part.type] = part.value;
  }
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    weekday: bag.weekday,
    hour: Number(bag.hour),
    minute: Number(bag.minute),
  };
}

export function dateISOInZone(timeZone: string, at?: Date): string {
  const { year, month, day } = partsInZone(timeZone, at);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseISODate(iso: string): { year: number; month: number; day: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`Bad date: ${iso}`);
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

export function formatStripDate(iso: string): { weekday: string; dateLabel: string } {
  const { year, month, day } = parseISODate(iso);
  const utc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return {
    weekday: WEEKDAYS[utc.getUTCDay()],
    dateLabel: `${MONTHS[month - 1]} ${day}, ${year}`,
  };
}

export function monthName(month: number): string {
  return MONTHS[month - 1] ?? String(month);
}

export function formatTime12(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  let h = Number(hStr);
  const m = Number(mStr);
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function nextPrintLabel(printTime: string, timeZone: string, at = new Date()): string {
  const now = partsInZone(timeZone, at);
  const [ph, pm] = printTime.split(":").map(Number);
  const todayPassed = now.hour > ph || (now.hour === ph && now.minute >= pm);
  return `${formatTime12(printTime)} ${todayPassed ? "tomorrow" : "today"}`;
}

export function addDaysISO(iso: string, days: number): string {
  const { year, month, day } = parseISODate(iso);
  const utc = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  const y = utc.getUTCFullYear();
  const m = utc.getUTCMonth() + 1;
  const d = utc.getUTCDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
