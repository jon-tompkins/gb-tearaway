import type { SupplyArtKind } from "@/lib/supplies";

const INK = "#1c1915";
const CREAM = "#f4eee3";
const PAPER = "#faf6ec";
const STAMP = "#c45c26";

/** Simple illustrated previews (not product photos) for the supplies page. */
export function SupplyArt({ kind }: { kind: SupplyArtKind }) {
  return (
    <svg viewBox="0 0 96 72" role="img" aria-hidden className="h-full w-full">
      <rect width="96" height="72" rx="10" fill={CREAM} />
      {kind === "thermal-printer" && (
        <>
          <rect x="30" y="8" width="36" height="26" rx="2" fill={PAPER} stroke={INK} strokeWidth="1.5" />
          <path d="M35 15h26M35 20h18M35 25h22" stroke="#cfc4b0" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="16" y="32" width="64" height="26" rx="6" fill={INK} />
          <rect x="24" y="38" width="48" height="4" rx="2" fill="#4a4338" />
          <circle cx="68" cy="50" r="3" fill={STAMP} />
          <circle cx="58" cy="50" r="2" fill="#6b6354" />
        </>
      )}
      {kind === "fanfold" && (
        <>
          <path d="M22 54 L40 44 L58 54 L76 44 L76 50 L58 60 L40 50 L22 60 Z" fill={PAPER} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M22 44 L40 34 L58 44 L76 34 L76 40 L58 50 L40 40 L22 50 Z" fill={PAPER} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M22 34 L40 24 L58 34 L76 24 L76 30 L58 40 L40 30 L22 40 Z" fill={PAPER} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="40" cy="30" r="2" fill={INK} />
          <circle cx="76" cy="30" r="2" fill={INK} />
        </>
      )}
      {kind === "sheets" && (
        <>
          <rect x="30" y="14" width="40" height="46" rx="2" fill={PAPER} stroke={INK} strokeWidth="1.5" transform="rotate(-8 50 37)" />
          <rect x="28" y="12" width="40" height="46" rx="2" fill={PAPER} stroke={INK} strokeWidth="1.5" transform="rotate(4 48 35)" />
          <path d="M36 24h24M36 30h18M36 36h22M36 42h14" stroke={STAMP} strokeWidth="2" strokeLinecap="round" transform="rotate(4 48 35)" />
        </>
      )}
      {kind === "laser-printer" && (
        <>
          <rect x="30" y="10" width="36" height="14" rx="1.5" fill={PAPER} stroke={INK} strokeWidth="1.5" />
          <rect x="12" y="22" width="72" height="32" rx="5" fill={INK} />
          <rect x="22" y="30" width="38" height="4" rx="2" fill="#4a4338" />
          <rect x="66" y="30" width="10" height="6" rx="1" fill="#4a4338" />
          <circle cx="71" cy="45" r="2.5" fill={STAMP} />
          <rect x="24" y="52" width="48" height="8" rx="1.5" fill={PAPER} stroke={INK} strokeWidth="1.5" />
        </>
      )}
      {kind === "ream" && (
        <>
          <rect x="24" y="22" width="48" height="34" rx="2" fill={PAPER} stroke={INK} strokeWidth="1.5" />
          <rect x="24" y="30" width="48" height="12" fill={STAMP} />
          <path d="M24 56 l4 4 h44 l-4 -4" fill="#e3d9c4" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
          <text x="48" y="39" textAnchor="middle" fontSize="8" fontWeight="700" fill={CREAM} fontFamily="Georgia,serif">500 SHEETS</text>
        </>
      )}
    </svg>
  );
}
