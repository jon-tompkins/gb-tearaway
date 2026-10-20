"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Sends one page-view beacon per route change (anonymous per-browser visitor id). */
export function PageTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    let visitor = "";
    try {
      visitor = localStorage.getItem("botb_vid") ?? "";
      if (!visitor) {
        visitor = crypto.randomUUID();
        localStorage.setItem("botb_vid", visitor);
      }
    } catch {
      // private mode etc. — count the view without a visitor id
    }
    const body = JSON.stringify({ path: pathname, referrer: document.referrer, visitor });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
    }
  }, [pathname]);
  return null;
}
