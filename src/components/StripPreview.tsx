"use client";

import { useEffect, useRef, useState } from "react";
import type { PrintJob } from "@/lib/types";

/**
 * On-screen preview = the ACTUAL print HTML in a scaled iframe, so it is
 * pixel-identical to the Save-as-PDF output (same layout, fonts, mono styling,
 * QR, and page proportions). No separate React renderer to drift out of sync.
 */
export function StripPreview({
  job,
  emptyHint,
  version = 0,
}: {
  job: PrintJob | null;
  emptyHint?: string;
  /** Bump to force the iframe to reload after a save/shuffle/print. */
  version?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const isLetter = job?.paperSize === "letter";
  // Design size at 96dpi: US Letter = 816×1056; 58mm strip = 219 wide (height measured).
  const designW = isLetter ? 816 : 219;
  const [scale, setScale] = useState(0.75);
  const [sheetH, setSheetH] = useState(isLetter ? 1056 : 520);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setScale(Math.min(el.clientWidth / designW, isLetter ? 1 : 1.7));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [designW, isLetter]);

  function onLoad() {
    try {
      const sheet = frameRef.current?.contentDocument?.querySelector(".sheet") as HTMLElement | null;
      if (sheet) setSheetH(sheet.getBoundingClientRect().height);
    } catch {
      // cross-origin (shouldn't happen, same origin) — keep the default height
    }
  }

  if (!job) {
    return (
      <div className="mx-auto w-full max-w-[640px]">
        <div className="strip-shell paper-grain rounded px-4 py-10 text-center">
          <div className="masthead-display text-lg">Back of the Box</div>
          <p className="mt-3 text-sm text-ink-soft">{emptyHint ?? "Save the layout, then preview."}</p>
        </div>
      </div>
    );
  }

  const naturalH = isLetter ? 1056 : sheetH;
  const src = `/api/render?kid=${encodeURIComponent(job.kidId)}&format=print&embed=1&v=${version}`;

  return (
    <div ref={wrapRef} className="mx-auto w-full" style={{ maxWidth: isLetter ? 640 : 384 }}>
      <div
        className="relative overflow-hidden rounded shadow-sm ring-1 ring-rule/40"
        style={{ height: naturalH * scale }}
      >
        <iframe
          ref={frameRef}
          key={`${job.kidId}:${version}`}
          src={src}
          title="Dispatch preview"
          onLoad={onLoad}
          scrolling="no"
          style={{
            width: designW,
            height: naturalH,
            border: 0,
            background: "#fff",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
    </div>
  );
}
