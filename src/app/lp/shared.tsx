import Link from "next/link";
import type { Metadata } from "next";
import { GetStartedButton } from "@/components/GetStartedButton";
import { moduleExample } from "@/lib/moduleExample";
import type { ModuleId } from "@/lib/types";

export const noIndex: Metadata = { robots: { index: false, follow: false } };

export function ex(id: ModuleId): string | null {
  try {
    return moduleExample(id).svg ?? null;
  } catch {
    return null;
  }
}

/** A real, generated puzzle drawing (server-rendered SVG). */
export function Puzzle({ id, label, className = "" }: { id: ModuleId; label: string; className?: string }) {
  const svg = ex(id);
  return (
    <figure className={`rounded-3xl border border-rule bg-paper p-4 shadow-sm ${className}`}>
      {svg ? (
        <div className="flex h-44 items-center justify-center [&_svg]:h-full [&_svg]:w-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="flex h-44 items-center justify-center text-5xl">🧩</div>
      )}
      <figcaption className="mt-3 text-center text-xl font-semibold text-ink">{label}</figcaption>
    </figure>
  );
}

export function LpHeader() {
  return (
    <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-5">
      <Link href="/" className="flex items-center gap-2">
        <img src="/logo-mark.png" alt="" width={36} height={36} className="h-9 w-9 rounded-md" />
        <span className="masthead-display text-xl">Back of the Box</span>
      </Link>
      <Link href="/lp" className="text-sm text-ink-soft underline">All options</Link>
    </header>
  );
}

export const cta = "inline-flex items-center justify-center rounded-2xl bg-ink px-8 py-5 text-2xl font-semibold text-cream shadow-md transition hover:bg-[#2c2620] focus:outline-none focus-visible:ring-4 focus-visible:ring-stamp/40";

export function Start({ label = "Make my page" }: { label?: string }) {
  return <GetStartedButton className={cta} callbackUrl="/app/build" label={label} />;
}

export function Sample() {
  return (
    <a href="/api/sample/7-9" className="text-xl font-semibold text-ink underline underline-offset-4">
      See a real page first (PDF) ↓
    </a>
  );
}
