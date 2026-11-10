"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/AppNav";
import { useAppStore } from "@/lib/clientStore";
import { DEFAULT_SETTINGS, type AgeBand, type DeliveryMethod, type ModuleId } from "@/lib/types";
import { moduleById } from "@/lib/modules";
import { packModulesIntoSlots } from "@/lib/slots";
import { detectTimezone } from "@/lib/tz";
import type { ExampleMap } from "@/lib/setupExamples";

/**
 * One-question-per-screen page builder. Big targets, plain words, always a way
 * back, and a final "here's your page" screen before anything is saved.
 */

type Interest = { id: string; emoji: string; title: string; blurb: string; ids: ModuleId[]; kidsOnly?: boolean };

const INTERESTS: Interest[] = [
  { id: "cross", emoji: "✏️", title: "Crosswords & word games", blurb: "Crossword, word find, word scramble", ids: ["crossword", "wordfind", "scramble"] },
  { id: "num", emoji: "🔢", title: "Number puzzles", blurb: "Sudoku, number patterns, number cross", ids: ["sudoku", "sequence", "numbercross"] },
  { id: "logic", emoji: "🧠", title: "Brain teasers", blurb: "Logic grid and secret codes", ids: ["logicgrid", "cryptogram"] },
  { id: "read", emoji: "📖", title: "Poems & quotes", blurb: "A poem, a famous quote, a word of the day", ids: ["poem", "quote", "word"] },
  { id: "hist", emoji: "🏛️", title: "History & trivia", blurb: "This day in history, fun facts, world records", ids: ["history", "fact", "records"] },
  { id: "maze", emoji: "🌀", title: "Mazes & pictures", blurb: "Mazes, connect the dots, color by number", ids: ["maze", "dots", "colorbynumber"], kidsOnly: true },
  { id: "animals", emoji: "🦁", title: "Animals & nature", blurb: "An animal of the day, jokes and riddles", ids: ["animal", "joke", "riddle"], kidsOnly: true },
];

const LEVELS: { id: AgeBand; title: string; blurb: string }[] = [
  { id: "4-6", title: "Easier", blurb: "Short, simple, quick wins" },
  { id: "7-9", title: "Medium", blurb: "A good everyday mix" },
  { id: "10-12", title: "Harder", blurb: "A real challenge" },
];

export const WIZARD_PREVIEW_IDS: ModuleId[] = Array.from(new Set(INTERESTS.flatMap((i) => i.ids))).concat(["weather"]);

const TOTAL = 5;
const big = "w-full rounded-2xl border-2 px-5 py-5 text-left text-xl transition focus:outline-none focus-visible:ring-4 focus-visible:ring-stamp/40";
const on = "border-ink bg-ink text-cream";
const off = "border-rule bg-paper text-ink hover:border-ink/40";

function Thumb({ id, examples }: { id: ModuleId; examples: ExampleMap }) {
  const ex = examples[id];
  if (ex?.svg) {
    return <div className="h-28 [&_svg]:h-full [&_svg]:w-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: ex.svg }} />;
  }
  return <p className="h-28 overflow-hidden font-mono text-xs leading-snug text-ink">{ex?.text?.slice(0, 5).join("\n") ?? moduleById(id).blurb}</p>;
}

export default function BuildWizard({ examples }: { examples: ExampleMap }) {
  const router = useRouter();
  const { save, hydrated } = useAppStore();
  const { data: session } = useSession();
  const accountEmail = session?.user?.email ?? "";

  const [step, setStep] = useState(1);
  const [who, setWho] = useState<"self" | "someone" | "child" | null>(null);
  const [name, setName] = useState("");
  const [likes, setLikes] = useState<string[]>([]);
  const [level, setLevel] = useState<AgeBand>("7-9");
  const [zip, setZip] = useState("");
  const [method, setMethod] = useState<DeliveryMethod>("email");
  const [email, setEmail] = useState("");
  const [time, setTime] = useState(DEFAULT_SETTINGS.printTime);
  const [tz, setTz] = useState<string>(DEFAULT_SETTINGS.timezone);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setTz(detectTimezone()), []);
  useEffect(() => {
    if (accountEmail && !email) setEmail(accountEmail);
  }, [accountEmail, email]);

  const kid = who === "child";
  const interests = INTERESTS.filter((i) => kid || !i.kidsOnly);
  const chosen = interests.filter((i) => likes.includes(i.id));

  // Build the page: round-robin one card per chosen interest until the page is full.
  const picked: ModuleId[] = (() => {
    const out: ModuleId[] = [];
    const queues = chosen.map((c) => [...c.ids]);
    const tryAdd = (id: ModuleId) => {
      if (out.includes(id)) return;
      const next = [...out, id];
      const slots = packModulesIntoSlots(next, DEFAULT_SETTINGS.paperSize);
      if (packedCount(slots) === next.length) out.push(id);
    };
    let progress = true;
    while (progress) {
      progress = false;
      for (const q of queues) {
        const id = q.shift();
        if (id) { tryAdd(id); progress = true; }
      }
    }
    if (chosen.length) tryAdd("weather");
    return out;
  })();
  const slots = packModulesIntoSlots(picked, DEFAULT_SETTINGS.paperSize);

  const label = who === "self" ? "your" : name.trim() ? `${name.trim()}'s` : "their";
  const canNext =
    (step === 1 && who !== null && (who === "self" || name.trim().length > 0)) ||
    (step === 2 && likes.length > 0) ||
    step === 3 ||
    step === 4 ||
    step === 5;

  async function create() {
    setBusy(true);
    setError(null);
    try {
      await save({
        ...(zip.trim() ? { settings: { weatherZip: zip.trim() } } : {}),
        createKid: {
          name: who === "self" ? "My page" : name.trim() || "My page",
          ageBand: level,
          paperSize: DEFAULT_SETTINGS.paperSize,
          slots,
          printTime: time,
          deliveryMethod: method,
          deliveryEmail: email.trim() || accountEmail || undefined,
          timezone: tz,
          status: "inactive",
        },
      });
      router.push("/app/modules");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function next() {
    setError(null);
    if (!canNext) return;
    if (step < TOTAL) setStep(step + 1);
    else void create();
  }

  if (!hydrated) {
    return (
      <AppShell title="Build a page">
        <p className="text-lg text-ink-soft">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Build a page">
      <div className="mx-auto max-w-2xl pb-28">
        <p className="text-base font-semibold text-ink-soft" aria-live="polite">Question {step} of {TOTAL}</p>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-rule/60" aria-hidden>
          <div className="h-full rounded-full bg-stamp transition-all" style={{ width: `${(step / TOTAL) * 100}%` }} />
        </div>

        {step === 1 && (
          <section className="mt-8">
            <h2 className="font-display text-3xl text-ink">Who is this page for?</h2>
            <div className="mt-6 space-y-3">
              {([
                ["self", "🙋", "Me"],
                ["someone", "💛", "Someone I care for"],
                ["child", "🧒", "A child"],
              ] as const).map(([id, emoji, t]) => (
                <button key={id} type="button" onClick={() => { setWho(id); setLikes([]); }} className={`${big} ${who === id ? on : off}`} aria-pressed={who === id}>
                  <span className="mr-3 text-3xl align-middle">{emoji}</span>{t}
                </button>
              ))}
            </div>
            {who && who !== "self" && (
              <div className="mt-6">
                <label htmlFor="nm" className="text-xl font-semibold text-ink">Their first name</label>
                <input id="nm" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="off" placeholder={kid ? "Sam" : "Grandpa Joe"} className="mt-2 w-full rounded-2xl border-2 border-rule bg-paper px-5 py-4 text-xl" />
              </div>
            )}
          </section>
        )}

        {step === 2 && (
          <section className="mt-8">
            <h2 className="font-display text-3xl text-ink">What {who === "self" ? "do you" : "do they"} enjoy?</h2>
            <p className="mt-1 text-lg text-ink-soft">Tap as many as you like. We'll fit them onto one page.</p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {interests.map((i) => {
                const sel = likes.includes(i.id);
                return (
                  <button key={i.id} type="button" aria-pressed={sel} onClick={() => setLikes(sel ? likes.filter((x) => x !== i.id) : [...likes, i.id])} className={`${big} ${sel ? on : off}`}>
                    <span className="block text-3xl">{i.emoji}{sel ? "  ✓" : ""}</span>
                    <span className="mt-1 block font-semibold">{i.title}</span>
                    <span className={`mt-0.5 block text-base ${sel ? "text-cream/80" : "text-ink-soft"}`}>{i.blurb}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="mt-8">
            <h2 className="font-display text-3xl text-ink">How tricky should it be?</h2>
            <p className="mt-1 text-lg text-ink-soft">You can change this any time.</p>
            <div className="mt-6 space-y-3">
              {LEVELS.map((l) => (
                <button key={l.id} type="button" aria-pressed={level === l.id} onClick={() => setLevel(l.id)} className={`${big} ${level === l.id ? on : off}`}>
                  <span className="block font-semibold">{l.title}</span>
                  <span className={`block text-base ${level === l.id ? "text-cream/80" : "text-ink-soft"}`}>{l.blurb}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="mt-8">
            <h2 className="font-display text-3xl text-ink">Where should it be sent?</h2>
            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="em" className="text-xl font-semibold text-ink">Email address</label>
                <input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={accountEmail || "you@example.com"} autoComplete="email" className="mt-2 w-full rounded-2xl border-2 border-rule bg-paper px-5 py-4 text-xl" />
                <p className="mt-1 text-base text-ink-soft">We email a page you can print.</p>
              </div>
              <div>
                <label htmlFor="tm" className="text-xl font-semibold text-ink">What time each morning?</label>
                <input id="tm" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-2 rounded-2xl border-2 border-rule bg-paper px-5 py-4 text-xl" />
              </div>
              {chosen.length > 0 && (
                <div>
                  <label htmlFor="zp" className="text-xl font-semibold text-ink">Zip code <span className="font-normal text-ink-soft">(for the weather)</span></label>
                  <input id="zp" value={zip} onChange={(e) => setZip(e.target.value)} inputMode="numeric" maxLength={10} autoComplete="postal-code" placeholder="11201" className="mt-2 w-48 rounded-2xl border-2 border-rule bg-paper px-5 py-4 text-xl" />
                </div>
              )}
              <details className="text-lg text-ink-soft">
                <summary className="cursor-pointer font-semibold text-ink">Other delivery choices</summary>
                <div className="mt-3 flex gap-3">
                  {([["email", "Email me"], ["dashboard", "Keep on my dashboard"]] as const).map(([id, t]) => (
                    <button key={id} type="button" onClick={() => setMethod(id as DeliveryMethod)} aria-pressed={method === id} className={`rounded-xl border-2 px-4 py-3 text-lg ${method === id ? on : off}`}>{t}</button>
                  ))}
                </div>
              </details>
            </div>
          </section>
        )}

        {step === 5 && (
          <section className="mt-8">
            <h2 className="font-display text-3xl text-ink">Here is {label} page</h2>
            <p className="mt-1 text-lg text-ink-soft">
              {picked.length} things, new every morning{who !== "self" && name.trim() ? ` for ${name.trim()}` : ""}.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {picked.map((id) => (
                <div key={id} className="rounded-2xl border border-rule bg-paper p-3">
                  <Thumb id={id} examples={examples} />
                  <p className="mt-2 text-lg font-semibold text-ink">{moduleById(id).name}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-lg text-ink-soft">
              Difficulty: <strong className="text-ink">{LEVELS.find((l) => l.id === level)?.title}</strong>. Sent {method === "email" ? `to ${email || accountEmail || "your email"}` : "to your dashboard"} at {time}.
            </p>
            <p className="mt-2 text-base text-ink-soft">Want to rearrange or swap cards? You can do that after, any time.</p>
          </section>
        )}

        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-lg text-red-800">{error}</p>}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-rule bg-cream/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <button type="button" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1 || busy} className="rounded-2xl border-2 border-rule bg-paper px-6 py-4 text-xl font-semibold text-ink disabled:opacity-40">← Back</button>
          <button type="button" onClick={next} disabled={!canNext || busy} className="flex-1 rounded-2xl bg-ink px-6 py-4 text-xl font-semibold text-cream disabled:opacity-40 sm:flex-none sm:min-w-56">
            {step === TOTAL ? (busy ? "Making it…" : "Make my page ✓") : "Next →"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function packedCount(slots: ReturnType<typeof packModulesIntoSlots>): number {
  return slots.reduce((n, s) => n + s.moduleIds.length, 0);
}
