"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppNav";
import { ModulePicker } from "@/components/ModulePicker";
import { useAppStore } from "@/lib/clientStore";
import {
  AGE_BANDS,
  DEFAULT_MODULES,
  DEFAULT_SETTINGS,
  TIMEZONES,
  type AgeBand,
  type ModuleId,
} from "@/lib/types";

export default function SetupPage() {
  const router = useRouter();
  const { save, hydrated } = useAppStore();
  const [name, setName] = useState("");
  const [ageBand, setAgeBand] = useState<AgeBand>("7-9");
  const [modules, setModules] = useState<ModuleId[]>([...DEFAULT_MODULES]);
  const [timezone, setTimezone] = useState(DEFAULT_SETTINGS.timezone);
  const [printTime, setPrintTime] = useState(DEFAULT_SETTINGS.printTime);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give them a first name.");
      return;
    }
    if (modules.length < 3) {
      setError("Pick at least 3 modules.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await save({
        createKid: {
          name: name.trim(),
          ageBand,
          modules,
          timezone,
          printTime,
        },
        settings: {
          timezone,
          printTime,
        },
      });
      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  if (!hydrated) {
    return (
      <AppShell title="Set up this kitchen">
        <p className="text-ink-soft">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Set up this kitchen"
      subtitle="Kids are profiles, not users. One name, an age band, and 3–5 morning modules."
    >
      <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-8">
        <div className="card space-y-4">
          <div className="field">
            <label htmlFor="name">Kid’s first name</label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sam"
              autoComplete="off"
              maxLength={40}
            />
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
              Age band
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {AGE_BANDS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setAgeBand(b.id)}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${
                    ageBand === b.id
                      ? "border-ink bg-ink text-cream"
                      : "border-rule bg-paper hover:border-ink/30"
                  }`}
                >
                  <strong className="font-display text-lg">{b.label}</strong>
                  <em
                    className={`mt-1 block text-xs not-italic ${
                      ageBand === b.id ? "text-cream/75" : "text-ink-soft"
                    }`}
                  >
                    {b.hint}
                  </em>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="tz">Timezone</label>
              <select
                id="tz"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
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
        </div>

        <ModulePicker selected={modules} onChange={setModules} />

        {error ? <p className="text-sm text-stamp">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Save & open dashboard"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => router.push("/app")}
          >
            Skip — use demo kid
          </button>
        </div>
      </form>
    </AppShell>
  );
}
