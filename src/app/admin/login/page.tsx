import { AdminLogin } from "@/components/AdminLogin";

export const metadata = { title: "Admin · Back of the Box", robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <div className="card space-y-4">
        <h1 className="font-display text-2xl text-ink">Admin</h1>
        <AdminLogin />
      </div>
    </main>
  );
}
