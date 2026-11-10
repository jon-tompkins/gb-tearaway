"use client";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";

/** Landing CTA: signed out → Google sign-in (then setup); signed in → straight to the app. */
export function GetStartedButton({ className, callbackUrl = "/app/setup", label = "Get started" }: { className?: string; callbackUrl?: string; label?: string }) {
  const { data: session, status } = useSession();
  if (status === "authenticated" && session?.user) {
    return (
      <Link href="/app" className={className}>
        Open your dashboard
      </Link>
    );
  }
  return (
    <button type="button" className={className} onClick={() => void signIn("google", { callbackUrl })}>
      {label}
    </button>
  );
}
