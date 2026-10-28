"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/AppNav";
import { useAppStore } from "@/lib/clientStore";
import {
  AGE_BANDS,
  DEFAULT_SETTINGS,
  DELIVERY_METHODS,
  type AgeBand,
  type DeliveryMethod,
} from "@/lib/types";
import { START_TEMPLATES, templateSlots } from "@/lib/templates";
import { detectTimezone, timezoneOptions } from "@/lib/tz";
import { NOUN } from "@/lib/copy";
import { HowItWorks } from "@/components/HowItWorks";

export default function SetupPage() {
  const router = useRouter();
  const { save, hydrated } = useAppStore();
  const { data: session } = useSession();
  const accountEmail = session?.user?.email ?? "";

  const [name, setName] = useState("");
  const [ageBand, setAgeBand] = useState<AgeBand>("7-9");
  const [deliveryTime, setDeliveryTime] = useState(DEFAULT_SETTINGS.printTime);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("email");
  const [deliveryEmail, setDeliveryEmail] = useState("");
  const [timezone, setTimezone] = useState<string>(DEFAULT_SETTINGS.timezone);
  // "scratch" = start with an empty page; otherwise a START_TEMPLATES id.
  const [templateId, setTemplateId] = useState<string>("scratch");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pick up the parent's timezone from the browser; they can change it below.
  useEffect(() => {
    setTimezone(detectTimezone());
  }, []);

  // Default the delivery address to the signed-in account holder's email.
  useEffect(() => {
    if (accountEmail && !deliveryEmail) setDeliveryEmail(accountEmail);
  }, [accountEmail, deliveryEmail]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give it a name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Start with a sensible default sheet; the parent shapes it on the next
      // screen (Configure dispatch).
      const paperSize = DEFAULT_SETTINGS.paperSize;
      const tpl = START_TEMPLATES.find((t) => t.id === templateId);
      await save({
        createKid: {
          name: name.trim(),
          ageBand,
          paperSize,
          slots: tpl
            ? templateSlots(tpl, paperSize)
            : [
                { id: "slot-0", moduleIds: [], mode: "single", cursor: 0, size: "full", column: 0 },
                { id: "slot-1", moduleIds: [], mode: "single", cursor: 0, size: "full", column: 1 },
              ],
          printTime: deliveryTime,
          deliveryMethod,
          deliveryEmail: deliveryEmail.trim() || accountEmail || undefined,
          timezone,
          status: "inactive",
        },
      });
      // Straight into configuring the page/cards.
      router.push("/app/modules");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  if (!hydrated) {
    return (
      <AppShell title={`Create ${NOUN.one}`}>
        <p className="text-ink-soft">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Create ${NOUN.one}`}
      subtitle="Who's it for and when should it go out? You'll lay out the page next."
    >
      <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-8">
        <div className="-mb-4 text-right">
          <HowItWorks />
        </div>
        <div className="card space-y-5">
          <div className="field">
            <label htmlFor="name">Child&apos;s first name</label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sam"
              autoComplete="off"
              maxLength={40}
            />
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
              Age
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {AGE_BANDS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setAgeBand(b.id)}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${
                    ageBand === b.id
                      ? "border-ink bg-ink text-cream"
                      : "border-rule bg-paper hover:border-ink/30"
                  }`}
                >
                  <strong className="font-display text-lg">{b.label}</strong>
                  <em
                    className={`mt-1 block text-xs not-italic ${
                      ageBand === b.id ? "text-cream/75" : "text-ink-soft"
                    }`}
                  >
                    {b.hint}
                  </em>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="dt">Delivery time</label>
              <input
                id="dt"
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="tz">Time zone</label>
              <select id="tz" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                {timezoneOptions(timezone).map((z) => (
                  <option key={z} value={z}>
                    {z.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-ink-soft">Detected from your browser. Change it if it&apos;s wrong.</p>
            </div>
            <div className="field">
              <label htmlFor="dm">Delivery method</label>
              <select id="dm" value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}>
                {DELIVERY_METHODS.map((m) => (
                  <option key={m.id} value={m.id} disabled={!m.enabled}>
                    {m.label}
                    {m.enabled ? "" : " · soon"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="de">Send to</label>
            <input
              id="de"
              type="email"
              value={deliveryEmail}
              onChange={(e) => setDeliveryEmail(e.target.value)}
              placeholder={accountEmail || "you@example.com"}
              autoComplete="email"
            />
            <p className="mt-1 text-xs text-ink-soft">
              Defaults to your account email. Emailed each morning at the delivery time.
            </p>
          </div>
        </div>

        <div className="card space-y-3">
          <div>
            <h2 className="font-display text-lg text-ink">Start from a template</h2>
            <p className="text-sm text-ink-soft">Pick a ready-made page, then tweak it next. Or build your own from scratch.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {START_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateId(t.id)}
                aria-pressed={templateId === t.id}
                className={`rounded-2xl border px-3 py-3 text-left transition ${
                  templateId === t.id ? "border-ink bg-ink text-cream" : "border-rule bg-paper hover:border-ink/30"
                }`}
              >
                <strong className="font-display text-base">
                  <span aria-hidden>{t.emoji}</span> {t.name}
                </strong>
                <em className={`mt-0.5 block text-xs not-italic ${templateId === t.id ? "text-cream/75" : "text-ink-soft"}`}>
                  {t.blurb}
                </em>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setTemplateId("scratch")}
              aria-pressed={templateId === "scratch"}
              className={`rounded-2xl border border-dashed px-3 py-3 text-left transition ${
                templateId === "scratch" ? "border-ink bg-ink text-cream" : "border-rule bg-paper hover:border-ink/30"
              }`}
            >
              <strong className="font-display text-base">✏️ Build from scratch</strong>
              <em className={`mt-0.5 block text-xs not-italic ${templateId === "scratch" ? "text-cream/75" : "text-ink-soft"}`}>
                An empty page. Add cards one by one.
              </em>
            </button>
          </div>
        </div>

        {error ? <p className="text-sm text-stamp">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Creating…" : "Continue to layout →"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => router.push("/app")}
          >
            Cancel
          </button>
        </div>
      </form>
    </AppShell>
  );
}
