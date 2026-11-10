"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/AppNav";
import { useAppStore } from "@/lib/clientStore";
import {
  AGE_BANDS,
  DEFAULT_SETTINGS,
  DELIVERY_METHODS,
  type AgeBand,
  type DeliveryMethod,
} from "@/lib/types";
import { START_TEMPLATES, templateSlots } from "@/lib/templates";
import { MODULE_CATALOG, MODULE_CATEGORIES, moduleAudience, moduleById } from "@/lib/modules";
import { packModulesIntoSlots } from "@/lib/slots";
import { useModuleVisibility } from "@/lib/useModuleVisibility";
import type { ModuleId } from "@/lib/types";
import { detectTimezone, timezoneOptions } from "@/lib/tz";
import { NOUN } from "@/lib/copy";
import { HowItWorks } from "@/components/HowItWorks";

export type ExampleMap = Partial<Record<string, { svg?: string; locator?: string; text?: string[] }>>;

type Who = "kid" | "grownup";
const LOCATION_MODULES: ModuleId[] = ["weather", "news_national", "news_world"];

function Preview({ id, examples }: { id: ModuleId; examples: ExampleMap }) {
  const ex = examples[id];
  if (ex?.svg) {
    return (
      <div
        className="flex h-full items-center justify-center gap-2 [&_svg]:h-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:max-w-full"
        dangerouslySetInnerHTML={{ __html: ex.svg + (ex.locator ? `<div style="width:38%;flex:none">${ex.locator}</div>` : "") }}
      />
    );
  }
  if (ex?.text) {
    return (
      <div className="font-mono text-[0.62rem] leading-snug text-ink">
        {ex.text.map((l, i) => (
          <p key={i} className={i === 0 ? "font-semibold" : ""}>{l}</p>
        ))}
      </div>
    );
  }
  return <p className="text-xs text-ink-soft">{moduleById(id).blurb}</p>;
}

const GROWNUP_PRESETS: { id: string; name: string; emoji: string; blurb: string; ids: ModuleId[] }[] = [
  { id: "puzzles", name: "Puzzle Lover", emoji: "🧩", blurb: "Crossword, sudoku, logic grid and word find", ids: ["crossword", "sudoku", "logicgrid", "wordfind", "numbercross", "weather"] },
  { id: "classic", name: "Gentle Morning", emoji: "☕", blurb: "A poem, a quote, this day in history and a crossword", ids: ["crossword", "poem", "quote", "history", "word", "weather"] },
  { id: "sharp", name: "Keep Sharp", emoji: "🧠", blurb: "Logic, number patterns and trivia", ids: ["logicgrid", "sudoku", "sequence", "records", "fact", "weather"] },
];

const MAX_PICK_UNITS_MSG = "The page is full. Remove a card to make room.";

export default function SetupClient({ examples }: { examples: ExampleMap }) {
  const router = useRouter();
  const { save, hydrated } = useAppStore();
  const { data: session } = useSession();
  const vis = useModuleVisibility();
  const accountEmail = session?.user?.email ?? "";
  const paperSize = DEFAULT_SETTINGS.paperSize;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [who, setWho] = useState<Who>("kid");
  const [name, setName] = useState("");
  const [ageBand, setAgeBand] = useState<AgeBand>("7-9");
  const [deliveryTime, setDeliveryTime] = useState(DEFAULT_SETTINGS.printTime);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("email");
  const [deliveryEmail, setDeliveryEmail] = useState("");
  const [timezone, setTimezone] = useState<string>(DEFAULT_SETTINGS.timezone);
  const [zip, setZip] = useState("");
  const [presetId, setPresetId] = useState<string>("puzzle");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fits = (ids: ModuleId[]) => packModulesIntoSlots(ids, paperSize).length === ids.length;
  const fitPrefix = (ids: ModuleId[]) => {
    const out: ModuleId[] = [];
    for (const id of ids) if (fits([...out, id])) out.push(id);
    return out;
  };
  const presetIds = (id: string, w: Who): ModuleId[] => {
    if (w === "grownup") return GROWNUP_PRESETS.find((p) => p.id === id)?.ids ?? [];
    const t = START_TEMPLATES.find((x) => x.id === id);
    return t ? t.cards.flat() : [];
  };
  const [picked, setPicked] = useState<ModuleId[]>(() => fitPrefix(presetIds("puzzle", "kid")));

  useEffect(() => setTimezone(detectTimezone()), []);
  useEffect(() => {
    if (accountEmail && !deliveryEmail) setDeliveryEmail(accountEmail);
  }, [accountEmail, deliveryEmail]);

  function chooseWho(w: Who) {
    setWho(w);
    const id = w === "kid" ? "puzzle" : "puzzles";
    setPresetId(id);
    setPicked(fitPrefix(presetIds(id, w)));
  }
  function choosePreset(id: string) {
    setPresetId(id);
    setPicked(fitPrefix(presetIds(id, who)));
    setMsg(null);
  }
  function toggle(id: ModuleId) {
    setMsg(null);
    if (picked.includes(id)) return setPicked(picked.filter((x) => x !== id));
    if (!fits([...picked, id])) return setMsg(MAX_PICK_UNITS_MSG);
    setPicked([...picked, id]);
  }
  function move(id: ModuleId, dir: -1 | 1) {
    const i = picked.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= picked.length) return;
    const next = [...picked];
    [next[i], next[j]] = [next[j], next[i]];
    setPicked(next);
  }
  function surprise() {
    const pool = MODULE_CATALOG.filter(
      (m) => vis.isVisible(m.id) && (who === "kid" || moduleAudience(m.id) === "all"),
    ).map((m) => m.id);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setMsg(null);
    setPicked(fitPrefix(shuffled));
  }

  const available = MODULE_CATALOG.filter(
    (m) =>
      vis.isVisible(m.id) &&
      (who === "kid" || moduleAudience(m.id) === "all") &&
      (catFilter === "all" || m.category === catFilter),
  );
  const slots = packModulesIntoSlots(picked, paperSize);
  const columns = Array.from(new Set(slots.map((s) => s.column ?? 0))).sort();
  const needsZip = picked.some((id) => LOCATION_MODULES.includes(id));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Enter inside a field on an earlier step should advance, not create.
    if (step !== 3) {
      if (step === 1 && !name.trim()) return setError("Give it a name.");
      setError(null);
      setStep((step + 1) as 2 | 3);
      return;
    }
    if (!name.trim()) {
      setStep(1);
      setError("Give it a name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await save({
        ...(zip.trim() ? { settings: { weatherZip: zip.trim() } } : {}),
        createKid: {
          name: name.trim(),
          // Grown-ups get the fullest, least-childish difficulty tier.
          ageBand: who === "grownup" ? "10-12" : ageBand,
          paperSize,
          slots,
          printTime: deliveryTime,
          deliveryMethod,
          deliveryEmail: deliveryEmail.trim() || accountEmail || undefined,
          timezone,
          status: "inactive",
        },
      });
      router.push("/app/modules");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  if (!hydrated) {
    return (
      <AppShell title={`Create ${NOUN.one}`}>
        <p className="text-ink-soft">Loading…</p>
      </AppShell>
    );
  }

  const tile = (on: boolean, dashed = false) =>
    `rounded-2xl border ${dashed ? "border-dashed" : ""} px-3 py-3 text-left transition ${
      on ? "border-ink bg-ink text-cream" : "border-rule bg-paper hover:border-ink/30"
    }`;
  const presets = who === "kid" ? START_TEMPLATES.map((t) => ({ id: t.id, name: t.name, emoji: t.emoji, blurb: t.blurb })) : GROWNUP_PRESETS;
  const stepDots = (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
      {["Who", "Build the page", "Delivery"].map((l, i) => (
        <span key={l} className={step === i + 1 ? "text-ink" : ""}>
          {i + 1}. {l}
          {i < 2 ? " ·" : ""}
        </span>
      ))}
    </div>
  );

  return (
    <AppShell title={`Create ${NOUN.one}`} subtitle="Pick who it's for, tap the cards you want, and watch the page fill up.">
      <form onSubmit={onSubmit} className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          {stepDots}
          <HowItWorks />
        </div>

        {step === 1 ? (
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="card space-y-5">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">Who is it for?</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button type="button" className={tile(who === "kid")} onClick={() => chooseWho("kid")} aria-pressed={who === "kid"}>
                    <strong className="font-display text-lg">🧒 A kid</strong>
                    <em className={`mt-0.5 block text-xs not-italic ${who === "kid" ? "text-cream/75" : "text-ink-soft"}`}>Age-tuned puzzles, animals, kid-safe news</em>
                  </button>
                  <button type="button" className={tile(who === "grownup")} onClick={() => chooseWho("grownup")} aria-pressed={who === "grownup"}>
                    <strong className="font-display text-lg">🧓 A grown-up</strong>
                    <em className={`mt-0.5 block text-xs not-italic ${who === "grownup" ? "text-cream/75" : "text-ink-soft"}`}>Crosswords, poems, history, easy on the eyes</em>
                  </button>
                </div>
              </div>
              <div className="field">
                <label htmlFor="name">{who === "kid" ? "Child's first name" : "First name"}</label>
                <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={who === "kid" ? "Sam" : "Grandpa Joe"} autoComplete="off" maxLength={40} />
              </div>
              {who === "kid" ? (
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">Age</div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {AGE_BANDS.map((b) => (
                      <button key={b.id} type="button" onClick={() => setAgeBand(b.id)} className={tile(ageBand === b.id)}>
                        <strong className="font-display text-lg">{b.label}</strong>
                        <em className={`mt-1 block text-xs not-italic ${ageBand === b.id ? "text-cream/75" : "text-ink-soft"}`}>{b.hint}</em>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            {error ? <p className="text-sm text-stamp">{error}</p> : null}
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                if (!name.trim()) return setError("Give it a name.");
                setError(null);
                setStep(2);
              }}
            >
              Next: build the page →
            </button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
            <div className="space-y-3">
              <div className="card space-y-3">
                <div>
                  <h2 className="font-display text-lg text-ink">Start from a mix, or pick your own</h2>
                  <p className="text-sm text-ink-soft">Tap a mix to preload the page, then add or remove cards below.</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {presets.map((t) => (
                    <button key={t.id} type="button" onClick={() => choosePreset(t.id)} className={tile(presetId === t.id)}>
                      <strong className="font-display text-sm">{t.emoji} {t.name}</strong>
                      <em className={`mt-0.5 block text-[0.7rem] not-italic ${presetId === t.id ? "text-cream/75" : "text-ink-soft"}`}>{t.blurb}</em>
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={surprise} className="rounded-full border border-rule bg-paper px-3 py-1 text-xs font-semibold text-ink-soft hover:border-ink/30">🎲 Surprise me</button>
                  <button type="button" onClick={() => { setPicked([]); setMsg(null); }} className="rounded-full border border-rule bg-paper px-3 py-1 text-xs font-semibold text-ink-soft hover:border-ink/30">Clear</button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[{ id: "all", name: "All" }, ...MODULE_CATEGORIES].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCatFilter(c.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${catFilter === c.id ? "border-ink bg-ink text-cream" : "border-rule bg-paper text-ink-soft"}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
              {msg ? <p className="text-sm text-stamp">{msg}</p> : null}
              <div className="grid gap-3 sm:grid-cols-2">
                {available.map((m) => {
                  const on = picked.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggle(m.id)}
                      aria-pressed={on}
                      className={`overflow-hidden rounded-xl border text-left transition ${on ? "border-ink ring-2 ring-ink" : "border-rule hover:border-ink/40"} bg-paper`}
                    >
                      <div className="relative h-28 overflow-hidden border-b border-rule/60 bg-[#fbf8f1] p-2">
                        <Preview id={m.id} examples={examples} />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#fbf8f1] to-transparent" />
                        <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${on ? "bg-ink text-cream" : "bg-paper text-ink-soft border border-rule"}`}>
                          {on ? "✓ Added" : "+ Add"}
                        </span>
                      </div>
                      <div className="px-3 py-2">
                        <div className="text-sm font-semibold text-ink">{m.name}</div>
                        <div className="line-clamp-2 text-xs text-ink-soft">{m.blurb}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="lg:sticky lg:top-4 lg:self-start">
              <div className="card space-y-2">
                <h3 className="font-display text-base text-ink">Your page</h3>
                {picked.length === 0 ? <p className="text-xs text-ink-soft">Tap cards to add them here.</p> : null}
                <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-rule bg-[#fbf8f1] p-1.5">
                  {(columns.length ? columns : [0, 1]).map((c) => (
                    <div key={c} className="flex flex-col gap-1.5">
                      {slots
                        .filter((s) => (s.column ?? 0) === c)
                        .map((s) => {
                          const id = s.moduleIds[0];
                          const h = s.size === "double" ? "min-h-[84px]" : s.size === "full" ? "min-h-[44px]" : "min-h-[22px]";
                          return (
                            <div key={s.id} className={`flex items-center justify-between gap-1 rounded border border-ink/30 bg-paper px-1.5 py-1 ${h}`}>
                              <span className="truncate text-[0.68rem] font-semibold text-ink">{moduleById(id).name}</span>
                              <span className="flex shrink-0 gap-0.5">
                                <button type="button" aria-label="Move earlier" onClick={() => move(id, -1)} className="px-1 text-xs text-ink-soft hover:text-ink">↑</button>
                                <button type="button" aria-label="Move later" onClick={() => move(id, 1)} className="px-1 text-xs text-ink-soft hover:text-ink">↓</button>
                                <button type="button" aria-label="Remove" onClick={() => toggle(id)} className="px-1 text-xs text-stamp">✕</button>
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  ))}
                </div>
                <p className="text-[0.7rem] text-ink-soft">{picked.length} cards. ↑↓ changes the order; cards flow into the two columns.</p>
                <div className="flex gap-2 pt-1">
                  <button type="button" className="btn-secondary text-sm" onClick={() => setStep(1)}>← Back</button>
                  <button type="button" className="btn-primary text-sm" disabled={picked.length === 0} onClick={() => setStep(3)}>Next →</button>
                </div>
              </div>
            </aside>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="card space-y-5">
              {needsZip ? (
                <div className="field">
                  <label htmlFor="zip">Zip code</label>
                  <input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="11201" inputMode="numeric" maxLength={10} autoComplete="postal-code" />
                  <p className="mt-1 text-xs text-ink-soft">For the weather{picked.some((id) => id.startsWith("news")) ? " and local stories" : ""}. That's all we need.</p>
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="field">
                  <label htmlFor="dt">Delivery time</label>
                  <input id="dt" type="time" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="tz">Time zone</label>
                  <select id="tz" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                    {timezoneOptions(timezone).map((z) => (
                      <option key={z} value={z}>{z.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="dm">Delivery method</label>
                  <select id="dm" value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}>
                    {DELIVERY_METHODS.map((m) => (
                      <option key={m.id} value={m.id} disabled={!m.enabled}>{m.label}{m.enabled ? "" : " · soon"}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="de">Send to</label>
                <input id="de" type="email" value={deliveryEmail} onChange={(e) => setDeliveryEmail(e.target.value)} placeholder={accountEmail || "you@example.com"} autoComplete="email" />
                <p className="mt-1 text-xs text-ink-soft">Defaults to your account email. Emailed each morning at the delivery time.</p>
              </div>
            </div>
            {error ? <p className="text-sm text-stamp">{error}</p> : null}
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn-secondary" onClick={() => setStep(2)}>← Back</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? "Creating…" : "Create page"}</button>
              <button type="button" className="btn-secondary" onClick={() => router.push("/app")}>Cancel</button>
            </div>
          </div>
        ) : null}
      </form>
    </AppShell>
  );
}
