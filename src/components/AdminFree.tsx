"use client";

import { useState } from "react";
import { editionSendLabel } from "@/lib/free/copy";
import type { FreeEdition } from "@/lib/free/editions";
import type { ModuleId } from "@/lib/types";
import type { EditionStats } from "@/lib/free/adminOps";
import type { FreeAdminSettings } from "@/lib/free/settings";

interface ModuleChoice {
  id: ModuleId;
  name: string;
  heavy: boolean;
}

export function AdminFree({
  initial,
  envOn,
  address,
  stats,
  modules,
  actor,
  timezones,
}: {
  initial: FreeAdminSettings;
  envOn: boolean;
  address: string;
  stats: EditionStats[];
  modules: ModuleChoice[];
  actor: string;
  timezones: string[];
}) {
  const [settings, setSettings] = useState(initial);
  const [resolved, setResolved] = useState(address);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [testTo, setTestTo] = useState(actor.includes("@") ? actor : "");
  const [draft, setDraft] = useState({ id: "", label: "", ageKey: "4-6", timezone: "America/New_York", weatherCity: "", weatherLat: "", weatherLon: "" });

  const stat = (id: string) => stats.find((s) => s.id === id);

  async function save(next: FreeAdminSettings) {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/free-editions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
    const data = (await res.json().catch(() => ({}))) as { error?: string; settings?: FreeAdminSettings; address?: string };
    setBusy(false);
    if (!res.ok) return setMsg(data.error || "Could not save.");
    if (data.settings) setSettings(data.settings);
    if (data.address != null) setResolved(data.address);
    setMsg("Saved.");
  }

  function patchEdition(id: string, patch: Partial<FreeEdition>) {
    setSettings({ ...settings, editions: settings.editions.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  }

  return (
    <div className="space-y-6">
      <div className={`rounded-xl border px-4 py-3 text-sm ${envOn ? "border-rule bg-paper" : "border-stamp bg-stamp/10"}`}>
        <p><strong>Env kill switch:</strong> {envOn ? "FREE_EDITIONS_ENABLED is on." : "FREE_EDITIONS_ENABLED is off. Nothing runs, even if the toggle below is on."}</p>
        <p className="mt-1"><strong>Admin toggle:</strong> {settings.enabled ? "on" : "off"}.{envOn && settings.enabled ? " Signup and sending are allowed." : " Signup and sending are stopped."}</p>
        <p className="mt-1"><strong>Mailing address in use:</strong> {resolved || "empty in settings and in FREE_EDITION_MAILING_ADDRESS. Sending is refused."}</p>
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={settings.enabled} onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })} />
        Free editions on (only applies when the env var is on)
      </label>

      <label className="field">
        <span>CAN-SPAM mailing address</span>
        <textarea value={settings.mailingAddress} onChange={(e) => setSettings({ ...settings, mailingAddress: e.target.value })} rows={2} placeholder="Falls back to FREE_EDITION_MAILING_ADDRESS" />
      </label>
      <label className="field">
        <span>Upgrade footer</span>
        <textarea value={settings.upgradeText} onChange={(e) => setSettings({ ...settings, upgradeText: e.target.value })} rows={3} />
      </label>
      <button type="button" className="btn-primary" disabled={busy} onClick={() => void save(settings)}>Save settings</button>
      {msg ? <p className="text-sm text-ink-soft">{msg}</p> : null}

      {settings.editions.map((edition) => {
        const numbers = stat(edition.id);
        return (
          <section key={edition.id} className="card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl">{edition.label}</h2>
              <span className="text-xs uppercase tracking-wider text-ink-soft">{edition.id} · {editionSendLabel(edition)}</span>
            </div>
            {edition.archived ? <p className="text-sm text-stamp">Archived. Subscribers stay on file and do not get mail.</p> : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field"><span>Display name</span><input value={edition.label} onChange={(e) => patchEdition(edition.id, { label: e.target.value })} /></label>
              <label className="field">
                <span>Age band</span>
                <select value={edition.ageKey} onChange={(e) => patchEdition(edition.id, { ageKey: e.target.value as FreeEdition["ageKey"] })}>
                  <option value="4-6">4–6 Easier</option>
                  <option value="7-10">7–10 Medium</option>
                </select>
              </label>
              <label className="field"><span>Difficulty (1–20)</span><input type="number" min={1} max={20} value={edition.difficulty} onChange={(e) => patchEdition(edition.id, { difficulty: Number(e.target.value) })} /></label>
              <label className="field">
                <span>Timezone</span>
                <select value={edition.timezone} onChange={(e) => patchEdition(edition.id, { timezone: e.target.value })}>
                  {timezones.map((z) => <option key={z}>{z}</option>)}
                </select>
              </label>
              <label className="field"><span>Send hour</span><input type="number" min={0} max={23} value={edition.sendHour} onChange={(e) => patchEdition(edition.id, { sendHour: Number(e.target.value) })} /></label>
              <label className="field"><span>Send minute</span><input type="number" min={0} max={59} value={edition.sendMinute ?? 0} onChange={(e) => patchEdition(edition.id, { sendMinute: Number(e.target.value) })} /></label>
              <label className="field"><span>City</span><input value={edition.weatherCity ?? ""} onChange={(e) => patchEdition(edition.id, { weatherCity: e.target.value, weatherOn: true })} /></label>
              <label className="field"><span>Latitude</span><input value={edition.weatherLat ?? ""} onChange={(e) => patchEdition(edition.id, { weatherLat: e.target.value === "" ? undefined : Number(e.target.value) })} /></label>
              <label className="field"><span>Longitude</span><input value={edition.weatherLon ?? ""} onChange={(e) => patchEdition(edition.id, { weatherLon: e.target.value === "" ? undefined : Number(e.target.value) })} /></label>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={edition.live && !edition.archived} onChange={(e) => patchEdition(edition.id, { live: e.target.checked, archived: false })} /> Live</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={edition.weatherOn !== false && !!(edition.weatherCity || edition.weatherLat != null)} onChange={(e) => patchEdition(edition.id, { weatherOn: e.target.checked })} /> Weather</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={!!edition.paused} onChange={(e) => patchEdition(edition.id, { paused: e.target.checked })} /> Pause sending</label>
            </div>
            <fieldset>
              <legend className="text-xs font-bold uppercase tracking-wider text-ink-soft">Rotation</legend>
              <div className="mt-2 grid gap-1 sm:grid-cols-3">
                {modules.map((m) => {
                  const easierBlocked = edition.ageKey === "4-6" && m.heavy;
                  const checked = !easierBlocked && (edition.rotationModules ? edition.rotationModules.includes(m.id) : true);
                  return (
                    <label key={m.id} className={`flex items-center gap-2 text-sm ${easierBlocked ? "text-ink-soft" : ""}`}>
                      <input
                        type="checkbox"
                        disabled={easierBlocked}
                        checked={checked}
                        onChange={(e) => {
                          const current = edition.rotationModules ?? modules.filter((item) => !(edition.ageKey === "4-6" && item.heavy)).map((item) => item.id);
                          const rotationModules = e.target.checked ? [...new Set([...current, m.id])] : current.filter((id) => id !== m.id);
                          patchEdition(edition.id, { rotationModules });
                        }}
                      />
                      {m.name}{easierBlocked ? " (too heavy for Easier)" : ""}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <p className="text-sm text-ink-soft">
              Confirmed {numbers?.confirmed ?? 0} · Pending {numbers?.pending ?? 0} · Unsubscribed {numbers?.unsubscribed ?? 0} · To custom {numbers?.toCustom ?? 0} · To trial {numbers?.toTrial ?? 0}
            </p>
            <div className="flex flex-wrap gap-2">
              <a className="btn-secondary" href={`/api/admin/free-editions/preview?edition=${edition.id}`} target="_blank" rel="noreferrer">Preview today&apos;s PDF</a>
              <button type="button" className="btn-secondary" onClick={() => void regenerate(edition.id)}>Regenerate today&apos;s PDF</button>
              <button type="button" className="btn-secondary" onClick={() => void testSend(edition.id, "confirm")}>Test confirmation</button>
              <button type="button" className="btn-secondary" onClick={() => void testSend(edition.id, "edition")}>Test today&apos;s edition</button>
              <button type="button" className="btn-secondary" onClick={() => void exportCsv(edition.id)}>Export CSV</button>
              {!edition.archived ? <button type="button" className="btn-secondary" onClick={() => void save({ ...settings, editions: settings.editions.map((e) => e.id === edition.id ? { ...e, archived: true, live: false, paused: true } : e) })}>Archive</button> : null}
            </div>
          </section>
        );
      })}

      <section className="card space-y-3">
        <h2 className="font-display text-xl">Test send</h2>
        <p className="text-sm text-ink-soft">Goes only to this one address. It does not mail subscribers. One test every 30 seconds, and 20 a day.</p>
        <label className="field"><span>Address</span><input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@example.com" /></label>
      </section>

      <section className="card space-y-3">
        <h2 className="font-display text-xl">Add an edition</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="field"><span>Id</span><input value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} placeholder="chicago-4-6" /></label>
          <label className="field"><span>Name</span><input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} /></label>
          <label className="field"><span>Band</span>
            <select value={draft.ageKey} onChange={(e) => setDraft({ ...draft, ageKey: e.target.value })}>
              <option value="4-6">4–6 Easier</option>
              <option value="7-10">7–10 Medium</option>
            </select>
          </label>
          <label className="field"><span>Timezone</span>
            <select value={draft.timezone} onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}>
              {timezones.map((z) => <option key={z}>{z}</option>)}
            </select>
          </label>
          <label className="field"><span>City (optional)</span><input value={draft.weatherCity} onChange={(e) => setDraft({ ...draft, weatherCity: e.target.value })} /></label>
          <label className="field"><span>Latitude</span><input value={draft.weatherLat} onChange={(e) => setDraft({ ...draft, weatherLat: e.target.value })} /></label>
          <label className="field"><span>Longitude</span><input value={draft.weatherLon} onChange={(e) => setDraft({ ...draft, weatherLon: e.target.value })} /></label>
        </div>
        <button type="button" className="btn-primary" onClick={() => void addEdition()}>Add edition</button>
      </section>
    </div>
  );

  async function regenerate(editionId: string) {
    setMsg(null);
    const res = await fetch("/api/admin/free-editions/regenerate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ editionId }) });
    const data = (await res.json().catch(() => ({}))) as { warn?: boolean; message?: string; error?: string; ok?: boolean };
    if (data.warn && data.message && window.confirm(data.message)) {
      const again = await fetch("/api/admin/free-editions/regenerate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ editionId, confirm: true }) });
      setMsg(again.ok ? "PDF regenerated. Nobody was re-emailed." : "Could not regenerate.");
      return;
    }
    setMsg(data.ok ? "PDF regenerated. Nobody was emailed." : data.error || data.message || "Could not regenerate.");
  }

  async function testSend(editionId: string, kind: "confirm" | "edition") {
    setMsg(null);
    const res = await fetch("/api/admin/free-editions/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ editionId, kind, to: testTo }) });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setMsg(res.ok ? "Test sent to that one address." : data.error || "Test failed.");
  }

  async function exportCsv(editionId: string) {
    if (!window.confirm("Download a CSV that includes subscriber emails for this edition?")) return;
    const res = await fetch("/api/admin/free-editions/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ editionId, confirm: true }) });
    if (!res.ok) return setMsg("Export failed.");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `free-${editionId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function addEdition() {
    const res = await fetch("/api/admin/free-editions/add", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, weatherLat: draft.weatherLat === "" ? undefined : Number(draft.weatherLat), weatherLon: draft.weatherLon === "" ? undefined : Number(draft.weatherLon) }) });
    const data = (await res.json().catch(() => ({}))) as { error?: string; settings?: FreeAdminSettings };
    if (!res.ok) return setMsg(data.error || "Could not add it.");
    if (data.settings) setSettings(data.settings);
    setMsg("Edition added. It is not live until you turn it on and save.");
  }
}
