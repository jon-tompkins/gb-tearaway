import { connection } from "next/server";
import { redirect } from "next/navigation";
import { AdminLogin } from "@/components/AdminLogin";
import { AuthButton } from "@/components/AuthButton";
import { isAdminEmail, passwordLoginEnabled } from "@/lib/admin";
import { auth } from "@/auth";

export const metadata = { title: "Admin · Back of the Box", robots: { index: false } };

export default async function AdminLoginPage() {
  await connection();
  const passwordLogin = passwordLoginEnabled();
  const session = passwordLogin ? null : await auth().catch(() => null);
  if (!passwordLogin && isAdminEmail(session?.user?.email)) redirect("/admin");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <div className="card space-y-4">
        <h1 className="font-display text-2xl text-ink">Admin</h1>
        {passwordLogin ? (
          <AdminLogin />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-ink-soft">Password login is off. Sign in with the owner Google account.</p>
            {session?.user?.email ? (
              <p className="text-sm text-ink-soft">Signed in as {session.user.email}. That account is not an admin.</p>
            ) : null}
            <AuthButton callbackUrl="/admin" />
          </div>
        )}
      </div>
    </main>
  );
}
