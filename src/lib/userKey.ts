import { auth } from "@/auth";

/** Shared store for signed-out visitors (the public demo). */
export const DEMO_KEY = "demo";

/**
 * The storage key for the current request: `user:<email>` when signed in,
 * else the shared demo store. Server-only (reads the auth session).
 */
export async function currentUserKey(): Promise<string> {
  try {
    const session = await auth();
    const email = session?.user?.email;
    return email ? `user:${email.toLowerCase()}` : DEMO_KEY;
  } catch {
    return DEMO_KEY;
  }
}
