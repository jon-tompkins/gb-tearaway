"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Msg = { role: "user" | "assistant"; content: string };

const STORE = "botb_support_chat";
const INTRO = "Ask a question, request a module, or send Jon a message.";

function visitorId(): string {
  try {
    let v = localStorage.getItem("botb_vid") ?? "";
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem("botb_vid", v);
    }
    return v;
  } catch {
    return "";
  }
}

export function SupportChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORE);
      if (saved) setMsgs(JSON.parse(saved) as Msg[]);
    } catch {
      // ignore
    }
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify(msgs.slice(-24)));
    } catch {
      // ignore
    }
    end.current?.scrollIntoView({ block: "end" });
  }, [msgs, open, busy]);

  const show = pathname === "/" || pathname === "/app" || pathname.startsWith("/app/");
  if (!show) return null;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: text.slice(0, 1000) }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-12), visitor: visitorId() }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      setMsgs([...next, { role: "assistant", content: data.message ?? "Sorry, something went wrong." }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "Couldn't reach support. Please try again in a moment." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="print:hidden fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open ? (
        <div className="flex h-[min(28rem,70vh)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-rule bg-paper shadow-lg">
          <div className="flex items-center justify-between border-b border-rule bg-cream px-4 py-2.5">
            <span className="font-display text-base text-ink">Help</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close help" className="text-lg leading-none text-ink-soft hover:text-ink">
              ×
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3 text-sm">
            <p className="text-ink-soft">{INTRO}</p>
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex"}>
                <p
                  className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 ${
                    m.role === "user" ? "bg-ink text-cream" : "border border-rule bg-cream text-ink"
                  }`}
                >
                  {m.content}
                </p>
              </div>
            ))}
            {busy ? <p className="text-ink-soft">Thinking…</p> : null}
            <div ref={end} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-rule p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1000}
              placeholder="Type a message"
              className="min-w-0 flex-1 rounded-lg border border-rule bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
            <button type="submit" disabled={busy || !input.trim()} className="btn-primary px-4 py-2 text-sm">
              Send
            </button>
          </form>
        </div>
      ) : null}
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="btn-primary rounded-full px-4 py-2 text-sm shadow-lg">
          Help
        </button>
      ) : null}
    </div>
  );
}
