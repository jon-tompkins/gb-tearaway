import { isKidActive, type DispatchStatus } from "@/lib/types";

/** Active / Inactive pill. Inactive explains itself on hover (and via the title for touch/AT). */
export function StatusBadge({ status }: { status?: DispatchStatus }) {
  if (isKidActive({ status })) {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-emerald-800">
        Active
      </span>
    );
  }
  const tip = "Inactive: you need a plan to activate this so it gets delivered.";
  return (
    <span className="group relative inline-block">
      <span
        tabIndex={0}
        aria-label={tip}
        className="cursor-help rounded-full bg-ink/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-ink-soft"
      >
        Inactive ⓘ
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-52 rounded-lg bg-ink px-2.5 py-1.5 text-xs font-normal normal-case leading-snug tracking-normal text-cream shadow-lg group-focus-within:block group-hover:block"
      >
        You need a plan to activate this so it gets delivered.
      </span>
    </span>
  );
}
