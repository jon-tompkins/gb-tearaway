"use client";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";

/**
 * Signed out: Google sign-in, then `callbackUrl` (setup, unless a caller overrides it).
 * Signed in: the hero and closing buttons open the dashboard. Pass `signedInHref`
 * when the link itself should stay on setup after sign-in.
 */
export function GetStartedButton({
  className,
  callbackUrl = "/app/setup",
  label = "Get started",
  signedInHref = "/app",
}: {
  className?: string;
  callbackUrl?: string;
  label?: string;
  signedInHref?: string;
}) {
  const { data: session, status } = useSession();
  if (status === "authenticated" && session?.user) {
    return (
      <Link href={signedInHref} className={className}>
        {signedInHref === "/app" ? "Open your dashboard" : label}
      </Link>
    );
  }
  return (
    <button type="button" className={className} onClick={() => void signIn("google", { callbackUrl })}>
      {label}
    </button>
  );
}
