"use client";

import { useEffect, useState } from "react";
import { dateISOInZone, formatStripDate } from "@/lib/dates";
import type { KidProfile } from "@/lib/types";

interface RunSummary {
  date: string;
  token: string;
  delivery: string;
  createdAt: string | null;
  emailedTo: string | null;
  emailedAt: string | null;
}

const btn = "rounded-full border border-rule bg-paper px-3 py-1 text-xs font-semibold text-ink hover:border-ink/40";

function label(iso: string): string {
  const { weekday, dateLabel } = formatStripDate(iso);
  return `${weekday} · ${dateLabel}`;
}

/** A dispatch's daily runs: today's (or a live preview before delivery) and past days. */
export function RunsPanel({ kid, timezone }: { kid: KidProfile; timezone: string }) {
  const [runs, setRuns] = useState<RunSummary[] | null>(null);
  const [signedIn, setSignedIn] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/runs?kidId=${encodeURIComponent(kid.id)}`)
      .then((r) => r.json())
      .then((d: { runs?: RunSummary[]; signedIn?: boolean }) => {
        if (!alive) return;
        setRuns(d.runs ?? []);
        setSignedIn(d.signedIn !== false);
      })
      .catch(() => alive && setRuns([]));
    return () => {
      alive = false;
    };
  }, [kid.id]);

  async function email(body: { token?: string; kidId?: string }, key: string) {
    setBusy(key);
    setMsg(null);
    try {
      const res = await fetch("/api/runs/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = (await res.json()) as { ok?: boolean; to?: string; error?: string };
      setMsg(d.ok ? `Sent to ${d.to}.` : d.error || "Couldn’t send.");
    } catch {
      setMsg("Couldn’t send.");
    } finally {
      setBusy(null);
    }
  }

  const today = dateISOInZone(kid.timezone || timezone);
  const todayRun = runs?.find((r) => r.date === today);
  const past = (runs ?? []).filter((r) => r.date !== today);

  return (
    <div className="rounded-xl border border-rule/70 bg-paper/60 p-3">
      <div className="text-[0.65rem] font-bold uppercase tracking-wider text-ink-soft">Today</div>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {todayRun ? (
          <>
            <span className="text-sm text-ink">
              {todayRun.emailedTo ? "Delivered by email" : "Ready to print"}
            </span>
            <a className={btn} href={`/api/runs/view?token=${todayRun.token}&auto=1`} target="_blank" rel="noreferrer">
              Print
            </a>
            <a className={btn} href={`/api/runs/pdf?token=${todayRun.token}`}>PDF</a>
            {signedIn ? (
              <button type="button" className={btn} disabled={!!busy} onClick={() => void email({ token: todayRun.token }, "today")}>
                {busy === "today" ? "Sending…" : "Email me"}
              </button>
            ) : null}
          </>
        ) : (
          <>
            <span className="text-sm text-ink-soft">Not delivered yet — preview:</span>
            <a className={btn} href={`/api/render?kid=${kid.id}&format=print&auto=1`} target="_blank" rel="noreferrer">
              Print
            </a>
            <a className={btn} href={`/api/render?kid=${kid.id}&format=pdf`}>PDF</a>
            {signedIn ? (
              <button type="button" className={btn} disabled={!!busy} onClick={() => void email({ kidId: kid.id }, "today")}>
                {busy === "today" ? "Sending…" : "Email me"}
              </button>
            ) : null}
          </>
        )}
      </div>

      {past.length ? (
        <div className="mt-3">
          <button
            type="button"
            className="text-xs font-semibold text-ink-soft hover:text-ink"
            onClick={() => setShowPast((v) => !v)}
          >
            {showPast ? "▾" : "▸"} Past dispatches ({past.length})
          </button>
          {showPast ? (
            <ul className="mt-2 divide-y divide-rule/60">
              {past.map((r) => (
                <li key={r.date} className="flex flex-wrap items-center gap-2 py-1.5">
                  <span className="min-w-[9rem] flex-1 text-sm text-ink">
                    {label(r.date)}
                    {r.emailedTo ? <span className="ml-1 text-xs text-ink-soft">· emailed</span> : null}
                  </span>
                  <a className={btn} href={`/api/runs/view?token=${r.token}&auto=1`} target="_blank" rel="noreferrer">
                    Print
                  </a>
                  <a className={btn} href={`/api/runs/pdf?token=${r.token}`}>PDF</a>
                  <button type="button" className={btn} disabled={!!busy} onClick={() => void email({ token: r.token }, r.date)}>
                    {busy === r.date ? "Sending…" : "Email me"}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : runs && signedIn ? (
        <p className="mt-2 text-xs text-ink-soft">Past dispatches will appear here after each delivery.</p>
      ) : null}
      {msg ? <p className="mt-2 text-xs text-ink-soft">{msg}</p> : null}
    </div>
  );
}
