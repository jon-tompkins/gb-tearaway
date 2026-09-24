"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppNav";
import { useAppStore } from "@/lib/clientStore";
import { uid } from "@/lib/rng";
import {
  DEFAULT_SETTINGS,
  TIMEZONES,
  type CalendarEvent,
} from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const { store, hydrated, activeKid, save } = useAppStore();

  const [timezone, setTimezone] = useState(DEFAULT_SETTINGS.timezone);
  const [printTime, setPrintTime] = useState(DEFAULT_SETTINGS.printTime);
  const [weatherCity, setWeatherCity] = useState(DEFAULT_SETTINGS.weatherCity);
  const [weatherZip, setWeatherZip] = useState(DEFAULT_SETTINGS.weatherZip);
  const [watchlist, setWatchlist] = useState("AAPL, DIS, NKE");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [weatherPreview, setWeatherPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!store?.kids.length) {
      router.replace("/app/setup");
      return;
    }
    if (!activeKid || !store) return;
    setTimezone(activeKid.timezone || store.settings.timezone);
    setPrintTime(activeKid.printTime || store.settings.printTime);
    setWeatherCity(store.settings.weatherCity || "");
    setWeatherZip(store.settings.weatherZip || "");
    setWatchlist((activeKid.watchlist || []).join(", "));
    setEvents([...(activeKid.events || [])]);
  }, [hydrated, store, activeKid, router]);

  async function onSave() {
    if (!activeKid) return;
    setBusy(true);
    setStatus(null);
    try {
      const list = watchlist
        .split(/[\s,]+/)
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean)
        .slice(0, 8);
      await save({
        settings: {
          timezone,
          printTime,
          weatherCity: weatherCity.trim(),
          weatherZip: weatherZip.trim(),
        },
        kid: {
          id: activeKid.id,
          timezone,
          printTime,
          watchlist: list,
          events,
        },
      });
      setStatus("Saved.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function checkWeather() {
    setWeatherPreview("Fetching…");
    try {
      const params = new URLSearchParams({
        city: weatherCity,
        zip: weatherZip,
        tz: timezone,
        age: activeKid?.ageBand || "7-9",
      });
      const res = await fetch(`/api/weather?${params}`);
      const data = (await res.json()) as {
        label?: string;
        summary?: string;
        source?: string;
        tip?: string;
      };
      setWeatherPreview(
        `${data.label ?? ""} — ${data.summary ?? ""} (${data.source ?? "?"}). ${data.tip ?? ""}`,
      );
    } catch {
      setWeatherPreview("Weather fetch failed.");
    }
  }

  function addEvent() {
    if (!newTitle.trim() || !newDate) return;
    setEvents((prev) => [
      ...prev,
      {
        id: uid("evt"),
        title: newTitle.trim(),
        date: newDate,
        time: newTime || undefined,
      },
    ]);
    setNewTitle("");
    setNewTime("");
  }

  if (!hydrated || !activeKid) {
    return (
      <AppShell title="Settings">
        <p className="text-ink-soft">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Settings"
      subtitle={`Print schedule, weather location, watchlist, and calendar for ${activeKid.name}.`}
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="card space-y-4">
          <h2 className="font-display text-lg">Print schedule</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="tz">Timezone</label>
              <select id="tz" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="pt">Print time</label>
              <input
                id="pt"
                type="time"
                value={printTime}
                onChange={(e) => setPrintTime(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-ink-soft">
            Paper size and modules are chosen per kid when you add them. Dispatch schedule here is
            shared defaults.
          </p>
        </section>

        <section className="card space-y-4">
          <h2 className="font-display text-lg">Weather location</h2>
          <p className="text-sm text-ink-soft">
            Used by the Weather module. Enter a city or US ZIP.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="city">City</label>
              <input
                id="city"
                value={weatherCity}
                onChange={(e) => setWeatherCity(e.target.value)}
                placeholder="Brooklyn"
              />
            </div>
            <div className="field">
              <label htmlFor="zip">US ZIP</label>
              <input
                id="zip"
                value={weatherZip}
                onChange={(e) => setWeatherZip(e.target.value)}
                placeholder="11201"
              />
            </div>
          </div>
          <button type="button" className="btn-secondary text-sm" onClick={() => void checkWeather()}>
            Test weather
          </button>
          {weatherPreview ? (
            <p className="text-sm text-ink-soft">{weatherPreview}</p>
          ) : null}
        </section>

        <section className="card space-y-4">
          <h2 className="font-display text-lg">Stock watchlist</h2>
          <p className="text-sm text-ink-soft">
            Comma-separated tickers. Prices are mocked — see{" "}
            <code className="text-xs">src/lib/stocks.ts</code>.
          </p>
          <div className="field">
            <label htmlFor="wl">Tickers</label>
            <input
              id="wl"
              value={watchlist}
              onChange={(e) => setWatchlist(e.target.value)}
              placeholder="AAPL, DIS, NKE"
            />
          </div>
        </section>

        <section className="card space-y-4">
          <h2 className="font-display text-lg">Calendar events</h2>
          <ul className="space-y-2">
            {events.length === 0 ? (
              <li className="text-sm text-ink-soft">No events yet.</li>
            ) : (
              events.map((ev) => (
                <li
                  key={ev.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-rule bg-paper px-3 py-2 text-sm"
                >
                  <span>
                    <strong>{ev.title}</strong>
                    <span className="ml-2 text-ink-soft">
                      {ev.date}
                      {ev.time ? ` · ${ev.time}` : ""}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="text-xs text-stamp"
                    onClick={() => setEvents((prev) => prev.filter((e) => e.id !== ev.id))}
                  >
                    Remove
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Event title"
              className="rounded-xl border border-rule bg-[#fffdf8] px-3 py-2"
            />
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="rounded-xl border border-rule bg-[#fffdf8] px-3 py-2"
            />
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="rounded-xl border border-rule bg-[#fffdf8] px-3 py-2"
            />
            <button type="button" className="btn-secondary" onClick={addEvent}>
              Add
            </button>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn-primary" disabled={busy} onClick={() => void onSave()}>
            {busy ? "Saving…" : "Save settings"}
          </button>
          {status ? <span className="text-sm text-ink-soft">{status}</span> : null}
        </div>
      </div>
    </AppShell>
  );
}
