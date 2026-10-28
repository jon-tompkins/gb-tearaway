import { loadPayload } from "@/lib/persist";
import type { AnswersPayload } from "@/lib/answers";

export const dynamic = "force-dynamic";

export default async function AnswersPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await loadPayload<AnswersPayload>(`answers:${token}`);

  return (
    <main className="min-h-screen bg-cream px-5 py-8">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-6 border-b border-rule pb-4 text-center">
          <div className="masthead-display text-2xl text-ink">Back of the Box</div>
          <div className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-stamp">
            {data?.stories?.length ? (data.items.length ? "Answers & stories" : "Today\u2019s stories") : "Answer key"}
          </div>
          {data ? (
            <p className="mt-1 text-sm text-ink-soft">
              {data.kidName} · {data.date}
            </p>
          ) : null}
        </header>

        {!data ? (
          <p className="text-center text-sm text-ink-soft">
            These answers aren&apos;t available anymore. Print a fresh page to get a new code.
          </p>
        ) : data.items.length === 0 && !data.stories?.length ? (
          <p className="text-center text-sm text-ink-soft">
            No answer-key modules on this one — nothing to reveal.
          </p>
        ) : (
          <ul className="space-y-4">
            {data.stories?.length ? (
              <li className="rounded-2xl border border-rule bg-paper px-4 py-3">
                <div className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-stamp">Read the full stories</div>
                <ul className="mt-2 space-y-2">
                  {data.stories.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2">
                        {s.headline}
                      </a>
                      {s.outlet ? <span className="text-sm text-ink-soft"> · {s.outlet}</span> : null}
                    </li>
                  ))}
                </ul>
              </li>
            ) : null}
            {data.items.map((it, i) => (
              <li key={i} className="rounded-2xl border border-rule bg-paper px-4 py-3">
                <div className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-stamp">
                  {it.title}
                </div>
                <div className="mt-1 whitespace-pre-wrap font-mono text-base font-semibold text-ink">
                  {it.answer}
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-8 text-center text-[0.7rem] uppercase tracking-[0.16em] text-ink-soft/70">
          Parents only · no peeking
        </p>
      </div>
    </main>
  );
}
