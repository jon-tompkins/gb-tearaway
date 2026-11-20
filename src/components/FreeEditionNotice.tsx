"use client";

import { useEffect, useState } from "react";

/**
 * Shown after a custom page or a trial pauses the free edition.
 * One button turns the shared daily email back on.
 */
export function FreeEditionNotice() {
  const [info, setInfo] = useState<{ show: boolean; label?: string } | null>(null);
  const [kept, setKept] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/free/status")
      .then((r) => (r.ok ? r.json() : { show: false }))
      .then((j: { show?: boolean; label?: string }) => {
        if (!cancelled) setInfo({ show: !!j.show, label: j.label });
      })
      .catch(() => {
        if (!cancelled) setInfo({ show: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (kept) {
    return (
      <div className="border-b border-rule bg-paper px-4 py-2 text-center text-sm text-ink">
        You&apos;ll keep getting the free daily page too.
      </div>
    );
  }
  if (!info?.show) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-rule bg-paper px-4 py-2 text-center text-sm text-ink">
      <span>
        The free daily email is paused so you don&apos;t get two pages.
        {info.label ? ` (${info.label})` : ""}
      </span>
      <button
        type="button"
        className="font-semibold underline disabled:opacity-50"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void fetch("/api/free/keep", { method: "POST" })
            .then((r) => {
              if (r.ok) setKept(true);
            })
            .finally(() => setBusy(false));
        }}
      >
        Keep the free page
      </button>
    </div>
  );
}
