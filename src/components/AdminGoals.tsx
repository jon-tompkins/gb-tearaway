"use client";

import { useState } from "react";
import { GOAL_METRICS, type Goal, type GoalMetric } from "@/lib/marketingGoals";

export function AdminGoals({ initial, values }: { initial: Goal[]; values: Record<GoalMetric, number> }) {
  const [goals, setGoals] = useState(initial);
  const [metric, setMetric] = useState<GoalMetric>("accounts");
  const [target, setTarget] = useState("");
  const [by, setBy] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(next: Goal[]) {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/marketing-goals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ goals: next }),
      });
      if (r.ok) setGoals(((await r.json()) as { goals: Goal[] }).goals);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {goals.length ? (
        <ul className="space-y-3">
          {goals.map((g) => {
            const v = values[g.metric] ?? 0;
            const pct = Math.min(100, Math.round((v / g.target) * 100));
            return (
              <li key={g.id}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-ink">
                    {GOAL_METRICS[g.metric]}
                    {g.by ? <span className="text-ink-soft"> · by {g.by}</span> : null}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="tabular-nums text-ink-soft">
                      {v} / {g.target} ({pct}%)
                    </span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void save(goals.filter((x) => x.id !== g.id))}
                      className="text-xs text-ink-soft hover:text-stamp"
                      aria-label="Remove goal"
                    >
                      remove
                    </button>
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded bg-cream">
                  <div className="h-full rounded bg-ink/70" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-ink-soft">No goals yet. Add one below.</p>
      )}
      <form
        className="flex flex-wrap items-end gap-2 border-t border-rule pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          const t = Number(target);
          if (!(t > 0)) return;
          void save([...goals, { id: "", metric, target: t, ...(by ? { by } : {}) }]);
          setTarget("");
          setBy("");
        }}
      >
        <select value={metric} onChange={(e) => setMetric(e.target.value as GoalMetric)} className="rounded-lg border border-rule bg-cream px-2 py-1.5 text-sm">
          {Object.entries(GOAL_METRICS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
        <input value={target} onChange={(e) => setTarget(e.target.value)} inputMode="numeric" placeholder="Target" className="w-24 rounded-lg border border-rule bg-cream px-2 py-1.5 text-sm" />
        <input type="date" value={by} onChange={(e) => setBy(e.target.value)} className="rounded-lg border border-rule bg-cream px-2 py-1.5 text-sm" />
        <button type="submit" disabled={busy} className="btn-secondary">
          Add goal
        </button>
      </form>
    </div>
  );
}
