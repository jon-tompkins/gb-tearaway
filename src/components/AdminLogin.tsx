"use client";

import { useState } from "react";

export function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    if (r?.ok) {
      window.location.href = "/admin";
      return;
    }
    setError(r ? "Wrong password." : "Couldn't reach the server.");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        type="password"
        autoFocus
        autoComplete="current-password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm"
      />
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      <button type="submit" disabled={busy || !password} className="btn-primary w-full disabled:opacity-50">
        {busy ? "Checking…" : "Enter"}
      </button>
    </form>
  );
}
