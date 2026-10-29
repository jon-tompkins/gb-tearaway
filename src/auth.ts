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
 *   https://backofthebox.xyz/api/auth/callback/google
 *   http://localhost:3000/api/auth/callback/google   (for local dev)
 *
 * Sign-in is optional for now — the demo still works signed out. Accounts are
 * scaffolding for per-user dispatches later.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      // Basic sign-in only (openid/email/profile). Calendar sync is paused: its
      // scope (calendar.readonly) is "sensitive" and triggers Google's
      // unverified-app warning until the app is verified. Re-add it as an
      // opt-in connect step (incremental auth) when calendar is revived.
    }),
  ],
  trustHost: true,
  callbacks: {
    // Persist the Google access/refresh token on the JWT so server routes can
    // call the Calendar API on the user's behalf.
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      (session as { accessToken?: string }).accessToken =
        token.accessToken as string | undefined;
      return session;
    },
  },
});
