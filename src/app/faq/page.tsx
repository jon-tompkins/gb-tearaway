import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { FAQ } from "@/lib/faq";

export const metadata = {
  title: "FAQ | Back of the Box",
  description: "Pricing, printing, ages, news sources and privacy: answers to what parents ask about Back of the Box.",
};

export default function FaqPage() {
  return (
    <>
      <AppNav />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Questions parents ask</h1>
        <div className="mt-6 divide-y divide-rule/60 rounded-xl border border-rule bg-paper">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg text-ink">
                {f.q}
                <span className="text-ink-soft transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.a}</p>
              {f.href ? (
                <Link href={f.href} className="mt-2 inline-block text-sm font-semibold text-ink underline-offset-4 hover:underline">
                  {f.cta ?? "Learn more →"}
                </Link>
              ) : null}
            </details>
          ))}
        </div>
        <p className="mt-8 text-sm text-ink-soft">
          Something else? Email <a className="font-semibold text-stamp hover:underline" href="mailto:support@backofthebox.xyz">support@backofthebox.xyz</a>.
        </p>
      </main>
    </>
  );
}
