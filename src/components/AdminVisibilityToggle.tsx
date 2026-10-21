"use client";

import { useState } from "react";
import type { ModuleId } from "@/lib/types";

export function AdminVisibilityToggle({ id, initialHidden }: { id: ModuleId; initialHidden: boolean }) {
  const [hidden, setHidden] = useState(initialHidden);
  const [busy, setBusy] = useState(false);
  async function flip() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/visibility", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, hidden: !hidden }),
      });
      if (res.ok) setHidden(!hidden);
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      type="button"
      onClick={flip}
      disabled={busy}
      title={hidden ? "Only you can see this module. Click to make it public." : "Public. Click to hide it from everyone but you."}
      className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold transition ${
        hidden ? "bg-stamp/15 text-stamp" : "bg-cream text-ink-soft hover:text-ink"
      } ${busy ? "opacity-50" : ""}`}
    >
      {hidden ? "Hidden" : "Public"}
    </button>
  );
}
