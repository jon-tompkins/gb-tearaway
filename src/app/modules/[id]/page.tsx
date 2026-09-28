import Link from "next/link";
import { notFound } from "next/navigation";
import { isModuleId, moduleById, moduleSize, MODULE_CATEGORIES, MODULE_CATALOG } from "@/lib/modules";
import type { SlotSize } from "@/lib/types";
import { MODULE_INFO } from "@/lib/moduleInfo";
import { moduleExample } from "@/lib/moduleExample";

function sizeLabel(sz: SlotSize): string {
  return sz === "half" ? "½ card" : sz === "double" ? "2× card (tall)" : "1× card";
}

export function generateStaticParams() {
  return MODULE_CATALOG.map((m) => ({ id: m.id }));
}

export default async function ModuleDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isModuleId(id)) notFound();
  const meta = moduleById(id);
  const info = MODULE_INFO[id];
  const ex = moduleExample(id);
  const catName = MODULE_CATEGORIES.find((c) => c.id === meta.category)?.name ?? meta.category;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <Link href="/modules" className="text-sm font-semibold text-ink-soft hover:text-ink">
        ← All modules
      </Link>

      <header className="mt-3">
        <div className="flex items-center gap-2 text-[0.6rem] font-semibold uppercase tracking-wide text-ink-soft">
          <span>{catName}</span>
          <span>·</span>
          <span>{sizeLabel(moduleSize(id))}</span>
        </div>
        <h1 className="mt-1 font-display text-3xl text-ink sm:text-4xl">{meta.name}</h1>
        <p className="mt-2 text-ink-soft">{meta.blurb}</p>
      </header>

      {/* Example */}
      <section className="mt-8">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-soft">Example</h2>
        <div className="rounded-2xl border border-rule bg-[#fbf8f1] p-5">
          {ex.svg ? (
            <div
              className="mx-auto flex max-w-sm items-center justify-center [&_svg]:h-auto [&_svg]:max-w-full"
              dangerouslySetInnerHTML={{ __html: ex.svg }}
            />
          ) : null}
          {ex.text ? (
            <div className="font-mono text-sm leading-relaxed text-ink">
              {ex.text.map((line, i) => (
                <p key={i} className={i === 0 && !ex.svg ? "font-semibold" : ""}>
                  {line}
                </p>
              ))}
            </div>
          ) : null}
          {ex.note ? <p className="mt-3 text-xs text-ink-soft">{ex.note}</p> : null}
        </div>
        {info.answerInApp ? (
          <p className="mt-2 text-xs text-ink-soft">
            🔒 The answer is never printed — it shows in the app (and via the dispatch&apos;s QR code).
          </p>
        ) : null}
      </section>

      {/* How it works */}
      <section className="mt-8">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-soft">How it works</h2>
        <p className="text-ink">{info.source}</p>
      </section>

      {/* What you can set */}
      <section className="mt-8">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-soft">What you can set</h2>
        <ul className="space-y-1.5">
          {info.config.map((c, i) => (
            <li key={i} className="flex gap-2 text-ink">
              <span aria-hidden className="text-ink-soft">
                •
              </span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10 border-t border-rule/60 pt-6">
        <Link href="/app" className="btn-primary">
          Build a dispatch
        </Link>
      </div>
    </main>
  );
}
