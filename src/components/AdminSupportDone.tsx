"use client";

import { useState } from "react";

export function AdminSupportDone({ itemKey, initialDone }: { itemKey: string; initialDone: boolean }) {
  const [done, setDone] = useState(initialDone);
  const [busy, setBusy] = useState(false);
  async function flip() {
    setBusy(true);
    try {
      const status = done ? "new" : "done";
      const res = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: itemKey, status }),
      });
      if (res.ok) setDone(!done);
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      type="button"
      onClick={flip}
      disabled={busy}
      className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold transition ${
        done ? "bg-cream text-ink-soft hover:text-ink" : "bg-stamp/15 text-stamp"
      } ${busy ? "opacity-50" : ""}`}
    >
      {done ? "Done (undo)" : "Mark done"}
    </button>
  );
}
