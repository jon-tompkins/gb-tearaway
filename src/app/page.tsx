import Link from "next/link";
import { AuthButton } from "@/components/AuthButton";

const PILLARS = [
  {
    title: "Real news, made kid-safe",
    body: "Today’s actual headlines — rewritten age-appropriate and filtered for anything not kid-friendly. Grounded in real stories, never made up.",
  },
  {
    title: "Puzzles, words & poems",
    body: "Mazes, sudoku, word searches, a word to grow on, real public-domain poems — age-banded, swappable cards you arrange yourself.",
  },
  {
    title: "Printed, not streamed",
    body: "Emailed each morning to print at home or on a 58mm thermal strip. Scan the QR for answers. Kids get paper only — no accounts, COPPA-friendly.",
  },
];

const STEPS = [
  { n: "1", title: "Pick the cards", body: "Build your kid’s page from a menu of modules, each sized to fit the sheet." },
  { n: "2", title: "Set delivery", body: "Choose a morning time and your email. That’s the whole setup." },
  { n: "3", title: "Tear & go", body: "It lands in your inbox at breakfast — print it, tear it, hand it over." },
];

export default function HomePage() {
  return (
    <div className="min-h-full bg-cream">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-ink text-[0.7rem] font-bold text-cream">
            B
          </span>
          <span className="masthead-display text-xl">Back of the Box</span>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <AuthButton compact />
          <Link
            href="/app"
            className="whitespace-nowrap text-sm font-semibold text-ink-soft hover:text-ink"
          >
            Open <span className="hidden sm:inline">dashboard </span>→
          </Link>
        </div>
      </header>

      <section className="border-y border-rule/50">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:py-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-stamp">
              Morning ritual · screen-free
            </p>
            <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl">
              A smarter breakfast, printed on paper — every single morning.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              Back of the Box builds your kid a daily puzzle page — real kid-safe news, a word to grow
              on, mazes, a poem — age-tuned, then emailed to you to print at home or on a tiny thermal
              strip. Parents set it up; kids just tear and go.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/app/setup" className="btn-primary">
                Create your dispatch
              </Link>
              <Link href="/app" className="btn-secondary">
                Peek at today’s
              </Link>
            </div>
            <p className="mt-4 text-sm text-ink-soft">
              Free to try — no signup needed. Sign in to save your setup and get it emailed each morning.
            </p>
          </div>

          <div className="mx-auto w-full max-w-[640px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/cereal-box.png"
              alt="A sample Back of the Box dispatch printed on the back of a cereal box"
              className="w-full drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div className="order-2 mx-auto w-full max-w-[440px] lg:order-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/dispatch-preview.png"
              alt="A real Back of the Box dispatch — weather, word of the day, a maze, a word search, and a poem"
              className="w-full rounded-lg border border-rule shadow-xl"
            />
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="font-display text-2xl text-ink sm:text-3xl">A real page, not a feed</h2>
            <p className="mt-2 max-w-xl text-ink-soft">
              This is an actual dispatch — the same thing that lands in your inbox. You choose the cards
              and their sizes; everything else is generated fresh each day and tuned to your kid’s age.
              Answers live behind a QR code, so kids solve first.
            </p>
            <div className="mt-6 space-y-4">
              {PILLARS.map((p) => (
                <div key={p.title} className="card">
                  <h3 className="font-display text-lg text-ink">{p.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-rule/50 bg-warm/40">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="font-display text-2xl text-ink sm:text-3xl">Three minutes to set up</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {STEPS.map((s) => (
              <article key={s.n} className="card">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm font-bold text-cream">
                  {s.n}
                </span>
                <h3 className="mt-3 font-display text-lg text-ink">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{s.body}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/app/setup" className="btn-primary">
              Create your dispatch
            </Link>
            <span className="text-sm text-ink-soft">No signup needed to try.</span>
          </div>
        </div>
      </section>

      <footer className="px-4 py-8 text-center text-xs text-ink-soft">
        Back of the Box · a screen-free morning ritual · made for the fridge, not the feed
      </footer>
    </div>
  );
}
