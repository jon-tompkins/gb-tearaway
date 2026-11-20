import { notFound } from "next/navigation";
import { liveEditions } from "@/lib/free/editions";
import { freeEditionAccess } from "@/lib/free/flag";
import { FreeSignup, type FreeEditionChoice } from "./FreeSignup";
import { FreeShell } from "./shell";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Free daily page | Back of the Box",
  description: "Get a shared daily puzzle page by email. Pick an age, confirm your address. No account and no child names.",
};

export default function FreePage() {
  if (!freeEditionAccess().ok) notFound();
  const editions: FreeEditionChoice[] = liveEditions().map((e) => ({
    id: e.id,
    ageKey: e.ageKey,
    ageLabel: e.ageLabel,
    levelLabel: e.levelLabel,
    city: e.weatherCity ?? null,
    label: e.label,
  }));

  return (
    <FreeShell>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-stamp">Free daily edition</p>
      <h1 className="mt-3 font-display text-4xl leading-tight text-ink">A free daily page, by email.</h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-soft">
        Pick an edition and your email. After you confirm, the same page goes to every family on that edition, around 6:00 a.m.
        We don&apos;t ask for a child&apos;s name, birthday, or anything beyond the edition you pick.
      </p>
      <div className="mt-8">
        <FreeSignup editions={editions} />
      </div>
    </FreeShell>
  );
}
