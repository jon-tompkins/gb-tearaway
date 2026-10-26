"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { AuthButton } from "./AuthButton";

/**
 * Home-page header actions. Signed in: a clear Dashboard button (no sign-out
 * clutter on the landing page). Signed out: just Sign in.
 */
export function HomeHeaderActions() {
  const { data: session, status } = useSession();
  const signedIn = status === "authenticated" && !!session?.user;
  return (
    <div className="flex shrink-0 items-center gap-3">
      {signedIn ? (
        <Link
          href="/modules"
          className="hidden whitespace-nowrap text-sm font-semibold text-ink-soft hover:text-ink sm:inline"
        >
          Modules
        </Link>
      ) : null}
      {signedIn ? (
        <Link
          href="/app"
          className="flex items-center gap-2 whitespace-nowrap rounded-full bg-ink px-3.5 py-1.5 text-sm font-semibold text-cream transition hover:bg-ink/85"
        >
          {session.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="" className="h-5 w-5 rounded-full" />
          ) : null}
          Dashboard →
        </Link>
      ) : (
        <AuthButton compact />
      )}
    </div>
  );
}
