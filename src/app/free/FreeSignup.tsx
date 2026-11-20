"use client";

import { useMemo, useState } from "react";

export interface FreeEditionChoice {
  id: string;
  ageKey: "4-6" | "7-10";
  ageLabel: string;
  levelLabel: string;
  city: string | null;
  label: string;
}

export function FreeSignup({ editions }: { editions: FreeEditionChoice[] }) {
  const ages = useMemo(() => {
    const seen: FreeEditionChoice["ageKey"][] = [];
    for (const e of editions) if (!seen.includes(e.ageKey)) seen.push(e.ageKey);
    return seen;
  }, [editions]);
  const [age, setAge] = useState<FreeEditionChoice["ageKey"]>(ages[0] ?? "4-6");
  const forAge = editions.filter((e) => e.ageKey === age);
  const cities = forAge.filter((e) => e.city);
  const [city, setCity] = useState<string>("");
  const edition = forAge.find((e) => (e.city ?? "") === city) ?? forAge.find((e) => !e.city) ?? forAge[0];
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function pickAge(next: FreeEditionChoice["ageKey"]) {
    setAge(next);
    const still = editions.some((e) => e.ageKey === next && (e.city ?? "") === city);
    if (!still) setCity("");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!edition) return;
    const honeypot = String(new FormData(e.currentTarget).get("hp_field") ?? "");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/free/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, editionId: edition.id, hp_field: honeypot }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card space-y-2">
        <h2 className="font-display text-2xl text-ink">Check your email</h2>
        <p className="text-ink-soft">
          We sent a confirmation link. The daily page starts after you open it. Nothing is mailed until then.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-6">
      <fieldset className="space-y-2">
        <legend className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">Age</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ages.map((key) => {
            const sample = editions.find((e) => e.ageKey === key);
            const on = age === key;
            return (
              <label key={key} className={`cursor-pointer rounded-2xl border px-4 py-3 ${on ? "border-ink bg-ink text-cream" : "border-rule bg-paper"}`}>
                <input
                  type="radio"
                  name="age"
                  className="absolute h-px w-px overflow-hidden"
                  checked={on}
                  onChange={() => pickAge(key)}
                />
                <span className="block font-semibold">{sample?.ageLabel}</span>
                <span className={`mt-0.5 block text-sm ${on ? "text-cream/80" : "text-ink-soft"}`}>{sample?.levelLabel}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {cities.length > 0 ? (
        <fieldset className="space-y-2">
          <legend className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">City weather</legend>
          <div className="grid gap-2">
            <label className={`cursor-pointer rounded-2xl border px-4 py-3 ${city === "" ? "border-ink bg-paper" : "border-rule bg-paper"}`}>
              <input type="radio" name="city" className="mr-2" checked={city === ""} onChange={() => setCity("")} />
              No city weather
            </label>
            {cities.map((c) => (
              <label key={c.id} className={`cursor-pointer rounded-2xl border px-4 py-3 ${city === c.city ? "border-ink bg-paper" : "border-rule bg-paper"}`}>
                <input
                  type="radio"
                  name="city"
                  className="mr-2"
                  checked={city === c.city}
                  onChange={() => setCity(c.city ?? "")}
                />
                {c.city}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="field">
        <label htmlFor="free-email">Email</label>
        <input
          id="free-email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <div className="absolute -left-[9999px] h-0 overflow-hidden" aria-hidden="true">
        <label>
          Leave this empty
          <input name="hp_field" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      {edition ? <p className="text-sm text-ink-soft">You&apos;ll get {edition.label}. Arrives around 6:00 a.m. local time for that edition.</p> : null}
      {error ? <p className="text-sm font-semibold text-stamp">{error}</p> : null}
      <button type="submit" className="btn-primary w-full" disabled={busy || !edition}>
        {busy ? "Sending…" : "Email me this page"}
      </button>
    </form>
  );
}
