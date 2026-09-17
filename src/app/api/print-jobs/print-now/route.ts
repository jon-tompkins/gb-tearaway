import { NextResponse } from "next/server";
import { generateStrip } from "@/lib/generateStrip";
import { getActiveKid, getSettings, readStore, savePrintJob, writeStore } from "@/lib/store";
import { fetchWeather } from "@/lib/weather";
import {
  advanceInOrderCursors,
  ensureKidSlots,
  flattenSlotModules,
} from "@/lib/slots";

export const runtime = "nodejs";

/** Generate & save today's job using the current preview nonce; advance in_order cursors. */
export async function POST() {
  const store = await readStore();
  const kid = await getActiveKid(store);
  if (!kid) {
    return NextResponse.json({ error: "No kid profile — complete setup first" }, { status: 404 });
  }
  const settings = getSettings(store);
  const nonce = store.nonceByKid[kid.id] ?? 0;
  const kidNorm = ensureKidSlots(kid);
  const pool = flattenSlotModules(kidNorm.slots);

  let weather;
  if (pool.includes("weather")) {
    weather = await fetchWeather({
      city: settings.weatherCity,
      zip: settings.weatherZip,
      timezone: kid.timezone || settings.timezone,
      ageBand: kid.ageBand,
    });
  }

  // Print uses current cursors (matches what you're looking at)
  const job = generateStrip(kidNorm, settings, { nonce, weather });
  job.status = "queued";
  await savePrintJob(job);

  // Then advance for the next run
  const store2 = await readStore();
  const idx = store2.kids.findIndex((k) => k.id === kid.id);
  if (idx >= 0) {
    store2.kids[idx] = {
      ...ensureKidSlots(store2.kids[idx]),
      slots: advanceInOrderCursors(ensureKidSlots(store2.kids[idx]).slots),
    };
    await writeStore(store2);
  }

  return NextResponse.json(job);
}
