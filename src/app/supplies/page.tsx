import { AppNav } from "@/components/AppNav";
import { SupplyArt } from "@/components/SupplyArt";
import { amazonUrl, SUPPLY_GROUPS } from "@/lib/supplies";

export const metadata = {
  title: "Supplies | Back of the Box",
  description: "No printer? An ink-free thermal printer and paper is all you need to print Back of the Box every morning.",
};

export default function SuppliesPage() {
  return (
    <>
    <AppNav />
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="font-display text-3xl text-ink sm:text-4xl">Supplies</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Back of the Box prints on any home printer. If you don&rsquo;t have one, this is what we&rsquo;d buy.
      </p>

      <section className="mt-8 rounded-2xl border border-rule bg-paper p-5">
        <h2 className="font-display text-xl text-ink">What&rsquo;s a thermal printer, and why no ink?</h2>
        <p className="mt-2 text-ink-soft">
          A thermal printer is the kind that prints store receipts. Instead of ink or toner, it uses a heated
          print head on special heat-sensitive paper that darkens where it&rsquo;s warmed. That means{" "}
          <strong className="text-ink">no ink cartridges to buy, no clogged nozzles, and nothing that dries out</strong>{" "}
          when you skip a week. The only thing you ever replace is paper. Prints are black and white, which suits
          mazes, crosswords and sudoku just fine.
        </p>
      </section>

      {SUPPLY_GROUPS.map((g) => (
        <section key={g.id} id={g.id} className="mt-10">
          <h2 className="font-display text-2xl text-ink">{g.title}</h2>
          <p className="mt-2 text-ink-soft">{g.intro}</p>
          <ul className="mt-4 space-y-3">
            {g.items.map((it) => (
              <li key={it.name} className="flex flex-wrap items-center gap-3 rounded-xl border border-rule bg-paper px-4 py-3">
                <div className="h-16 w-20 shrink-0 sm:h-[4.5rem] sm:w-24">
                  <SupplyArt kind={it.art} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-ink">{it.name}</div>
                  <div className="text-sm text-ink-soft">{it.blurb}</div>
                </div>
                <a
                  href={amazonUrl(it.query)}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="btn-secondary whitespace-nowrap"
                >
                  See on Amazon →
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="mt-10 border-t border-rule/60 pt-4 text-xs text-ink-soft">
        As an Amazon Associate we earn from qualifying purchases. Links cost you nothing extra and help keep Back of the Box running.
      </p>
    </main>
    </>
  );
}
