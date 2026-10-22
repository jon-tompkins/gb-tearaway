"use client";

import { useState } from "react";
import type { AccessCode } from "@/lib/billing";

type Row = Omit<AccessCode, "redeemedBy">;

const lengthLabel = (m: number) => (m === 0 ? "Forever" : `${m} month${m === 1 ? "" : "s"}`);

export function AdminCodes({ initial }: { initial: Row[] }) {
  const [codes, setCodes] = useState(initial);
  const [form, setForm] = useState({ code: "", months: "1", maxUses: "1", note: "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, months: Number(form.months), maxUses: Number(form.maxUses) }),
      });
      const j = (await r.json()) as { code?: Row; error?: string };
      if (j.code) {
        setCodes([j.code, ...codes]);
        setForm({ ...form, code: "", note: "" });
      } else setErr(j.error ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(c: Row) {
    const r = await fetch("/api/admin/codes", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: c.code, disabled: !c.disabled }),
    });
    if (r.ok) setCodes(codes.map((x) => (x.code === c.code ? { ...x, disabled: !c.disabled } : x)));
  }

  const input = "rounded-lg border border-rule bg-cream px-3 py-2 text-sm";
  return (
    <div className="space-y-6">
      <form onSubmit={create} className="card flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-ink-soft">
          Code (blank = random)
          <input className={`${input} font-mono uppercase`} value={form.code} placeholder="BOX-XXXX-XXXX" onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-soft">
          Free for
          <select className={input} value={form.months} onChange={(e) => setForm({ ...form, months: e.target.value })}>
            {[1, 2, 3, 6, 12].map((m) => (
              <option key={m} value={m}>{lengthLabel(m)}</option>
            ))}
            <option value={0}>Forever</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-soft">
          Uses (0 = unlimited)
          <input className={`${input} w-24`} type="number" min={0} value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
        </label>
        <label className="flex min-w-40 flex-1 flex-col gap-1 text-xs text-ink-soft">
          Note
          <input className={input} value={form.note} placeholder="Who it's for" onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </label>
        <button type="submit" className="btn-primary" disabled={busy}>
          Create code
        </button>
        {err ? <p className="w-full text-sm text-stamp">{err}</p> : null}
      </form>

      <div className="overflow-x-auto rounded-xl border border-rule bg-paper">
        <table className="w-full text-sm">
          <thead className="text-left text-[0.65rem] uppercase tracking-wide text-ink-soft">
            <tr className="border-b border-rule">
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Free for</th>
              <th className="px-3 py-2 text-right">Used</th>
              <th className="px-3 py-2">Note</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {codes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-ink-soft">No codes yet.</td>
              </tr>
            ) : null}
            {codes.map((c) => (
              <tr key={c.code} className={`border-b border-rule/50 last:border-0 ${c.disabled ? "opacity-50" : ""}`}>
                <td className="px-3 py-2 font-mono">{c.code}</td>
                <td className="px-3 py-2">{lengthLabel(c.months)}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {c.uses}/{c.maxUses || "∞"}
                </td>
                <td className="px-3 py-2 text-ink-soft">{c.note}</td>
                <td className="px-3 py-2 text-ink-soft">{c.createdAt.slice(0, 10)}</td>
                <td className="px-3 py-2 text-right">
                  <button type="button" onClick={() => void toggle(c)} className="rounded-full bg-cream px-2.5 py-0.5 text-[0.65rem] font-bold text-ink-soft hover:text-ink">
                    {c.disabled ? "Turn on" : "Turn off"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
