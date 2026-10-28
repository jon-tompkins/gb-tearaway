import Link from "next/link";
import { GetStartedButton } from "@/components/GetStartedButton";
import { HomeHeaderActions } from "@/components/HomeHeaderActions";
import { MODULE_CATALOG, MODULE_CATEGORIES } from "@/lib/modules";
import { getHiddenModules } from "@/lib/visibility";

// The module showcase leaves out admin-hidden modules; refresh every few minutes.
export const revalidate = 300;

const PILLARS = [
  {
    title: "Real news, made kid-safe",
    body: "Actual stories from places like Smithsonian, NASA, and Science News Explores, rewritten for your kid’s age and checked against the original article. Nothing is made up, and anything scary gets left out.",
  },
  {
    title: "Puzzles that fit the kid",
    body: "Mazes, sudoku, crosswords, word finds, riddles, and number patterns, with a word of the day and a real public-domain poem. Every card has its own difficulty dial.",
  },
  {
    title: "Paper, not a screen",
    body: "Print it on any home printer. Answers sit behind a QR code for you to check, so the kid solves first. Kids never need an account.",
  },
];

const STEPS = [
  { n: "1", title: "Pick the cards", body: "Choose modules and card sizes for your kid’s page. You can move them around and swap them anytime." },
  { n: "2", title: "Set a morning time", body: "Choose when it arrives: by email with a printable PDF, or waiting on your dashboard." },
  { n: "3", title: "Print & hand it over", body: "It’s fresh every day, so tomorrow’s page is new. Stick it on the fridge or take it to breakfast." },
];

const FAQ = [
  {
    q: "What does it cost?",
    a: "Your first month is free. After that it’s $20 a year for up to two kids, or $40 a year for up to five. Prefer to pay as you go? It’s $6 a quarter for up to two kids, or $12 a quarter for up to five. Sign in with Google to save your setup and get a page every morning.",
  },
  {
    q: "What do I need to print it?",
    a: "Any home printer works, since the page is made for US Letter.",
  },
  {
    q: "I don’t have a printer. How do I get started?",
    a: "No problem. An ink-free thermal printer costs less than a tank of ink and never runs dry, which is the real selling point. Our supplies page explains how they work and lists printers and paper we like.",
    href: "/supplies",
    cta: "See printers and paper →",
  },
  {
    q: "What ages is it for?",
    a: "About 4 to 12. You set an age when you make the page, and each card has its own 1–20 dial. Sudoku goes from 4×4 up to 9×9, mazes grow, and news cards start at level 5.",
  },
  {
    q: "Where does the news come from?",
    a: "From real outlets: Smithsonian, NASA, Science News Explores, Mongabay, Popular Science, IEEE Spectrum, Good News Network, and others. Each story is rewritten for kids, checked against the source article, and printed with its location. Crime, politics, and anything scary are left out.",
  },
  {
    q: "Does my kid need an account or a screen?",
    a: "No. Parents set it up, and kids just get the paper. We only ask for the kid’s first name, and there are no ads.",
  },
  {
    q: "Can I make pages for more than one kid?",
    a: "Yes. Each kid gets their own page with its own cards, difficulty, and delivery time.",
  },
];

export default async function HomePage() {
  const hidden = new Set<string>(await getHiddenModules().catch(() => []));
  const visible = MODULE_CATALOG.filter((m) => !hidden.has(m.id));
  const showcase = MODULE_CATEGORIES.map((c) => ({
    category: c,
    modules: visible.filter((m) => m.category === c.id),
  })).filter((g) => g.modules.length > 0);

  return (
    <div className="min-h-full bg-cream">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ink text-[0.7rem] font-bold text-cream">
            B
          </span>
          <span className="masthead-display whitespace-nowrap text-lg sm:text-xl">Back of the Box</span>
        </Link>
        <HomeHeaderActions />
      </header>

      <section className="border-y border-rule/50">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-stamp">
              Morning ritual · screen-free
            </p>
            <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl">
              A smarter breakfast, printed on paper — every single morning.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              Back of the Box makes your kid a fresh puzzle page every day: real kid-safe news, a maze,
              a crossword, a word to grow on, a joke for the table. You set the age and pick the cards.
              It lands at breakfast, ready to print.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <GetStartedButton className="btn-primary" />
              <Link href="/modules" className="btn-secondary">
                See Modules
              </Link>
            </div>
            <p className="mt-4 text-sm text-ink-soft">
              First month free. Then $20 a year for up to two kids, $40 for up to five (or $6 / $12 a quarter).
            </p>
          </div>

          <div className="mx-auto w-full max-w-[640px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/cereal-box.png"
              alt="A Back of the Box cereal box, morning brain cereal, with a real puzzle page on the front"
              className="mx-auto w-full max-w-[420px] drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      <section id="sample" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div className="order-2 mx-auto w-full max-w-[480px] lg:order-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/dispatch-preview.png"
              alt="A real Back of the Box page: weather, a space-themed crossword, a maze, a joke, a fun fact, a number pattern, a number grid, and a state and capital"
              className="w-full rounded-lg border border-rule shadow-xl"
            />
            <p className="mt-3 text-center text-xs text-ink-soft">
              A real morning page for a 7–9 year old, untouched.
            </p>
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="font-display text-2xl text-ink sm:text-3xl">A real page, not a feed</h2>
            <p className="mt-2 max-w-xl text-ink-soft">
              This is exactly what lands in your inbox. You choose the cards and their sizes, and the rest
              is new every morning and tuned to your kid.
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

      <section className="border-t border-rule/50">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-ink sm:text-3xl">
                {visible.length} cards to build with
              </h2>
              <p className="mt-1 text-sm font-semibold text-stamp">Over 25 modules and growing</p>
              <p className="mt-2 max-w-2xl text-ink-soft">
                Mix and match cards in three sizes, from a quick joke to a big crossword. One card
                can also rotate through a few modules, like sudoku one day and battleship the next.
              </p>
            </div>
            <Link href="/modules" className="text-sm font-semibold text-ink underline-offset-4 hover:underline">
              Browse every module →
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {showcase.map(({ category, modules }) => (
              <div key={category.id} className="card">
                <h3 className="font-display text-lg text-ink">{category.name}</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {modules.map((m) => (
                    <Link
                      key={m.id}
                      href={`/modules/${m.id}`}
                      className="rounded-full border border-rule bg-cream px-2.5 py-1 text-xs font-semibold text-ink-soft transition hover:border-ink/40 hover:text-ink"
                    >
                      {m.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
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
        </div>
      </section>

      <section className="border-t border-rule/50">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <h2 className="font-display text-2xl text-ink sm:text-3xl">Questions parents ask</h2>
          <div className="mt-6 divide-y divide-rule/60 rounded-xl border border-rule bg-paper">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg text-ink">
                  {f.q}
                  <span className="text-ink-soft transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.a}</p>
                {"href" in f && f.href ? (
                  <Link href={f.href} className="mt-2 inline-block text-sm font-semibold text-ink underline-offset-4 hover:underline">
                    {"cta" in f ? f.cta : "Learn more →"}
                  </Link>
                ) : null}
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-rule/50 bg-ink text-cream">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-4 py-14 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl">Tomorrow’s page could be on the table.</h2>
            <p className="mt-2 text-cream/75">Set it up tonight, and it arrives with breakfast.</p>
          </div>
          <GetStartedButton className="inline-flex items-center rounded-full bg-cream px-6 py-3 font-semibold text-ink transition hover:bg-paper" />
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-xs text-ink-soft sm:flex-row sm:justify-between">
        <span>Back of the Box · made for the fridge, not the feed</span>
        <nav className="flex gap-4">
          <Link href="/modules" className="hover:text-ink">Modules</Link>
          <Link href="/supplies" className="hover:text-ink">Supplies</Link>
          <Link href="/app" className="hover:text-ink">Dashboard</Link>
          <Link href="/app/setup" className="hover:text-ink">Get started</Link>
        </nav>
      </footer>
    </div>
  );
}
