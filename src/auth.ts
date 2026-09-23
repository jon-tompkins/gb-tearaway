import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Auth.js (NextAuth v5) — Google sign-in.
 *
 * Required env (set in Vercel + local .env.local):
 *   AUTH_SECRET         → `npx auth secret` (any long random string)
 *   AUTH_GOOGLE_ID      → Google OAuth client ID
 *   AUTH_GOOGLE_SECRET  → Google OAuth client secret
 *
 * Google Cloud → Credentials → OAuth client (Web). Authorized redirect URI:
 *   https://tearaway.vercel.app/api/auth/callback/google
 *   http://localhost:3000/api/auth/callback/google   (for local dev)
 *
 * Sign-in is optional for now — the demo still works signed out. Accounts are
 * scaffolding for per-user dispatches later.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  trustHost: true,
});
