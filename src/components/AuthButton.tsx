"use client";

import { signIn, signOut, useSession } from "next-auth/react";

/** Google sign-in / sign-out control. Optional for now — demo works signed out. */
export function AuthButton({ compact = false }: { compact?: boolean }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="px-3 py-1.5 text-sm text-ink-soft">…</span>;
  }

  if (session?.user) {
    const label = session.user.name?.split(" ")[0] ?? "Account";
    return (
      <div className="flex items-center gap-2">
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt=""
            className="h-6 w-6 rounded-full border border-rule"
          />
        ) : null}
        {!compact ? <span className="text-sm text-ink">{label}</span> : null}
        <button
          type="button"
          onClick={() => void signOut()}
          className="rounded-full px-3 py-1.5 text-sm text-ink-soft transition hover:bg-paper hover:text-ink"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void signIn("google")}
      className="flex items-center gap-2 rounded-full border border-rule bg-paper px-3 py-1.5 text-sm font-semibold text-ink transition hover:border-ink/30"
    >
      <GoogleGlyph />
      Sign in
    </button>
  );
}

function GoogleGlyph() {
  return (
    <svg aria-hidden width="15" height="15" viewBox="0 0 18 18">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.63z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
