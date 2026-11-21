"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AuthButton } from "./AuthButton";
import { openSupportChat } from "./SupportChat";

const LINKS = [
  { href: "/app", label: "Dashboard", exact: true },
  { href: "/modules", label: "Modules", exact: false },
  { href: "/app/booklet", label: "Booklet", exact: false },
  { href: "/supplies", label: "Supplies", exact: false },
  { href: "/faq", label: "FAQ", exact: false },
];

export function AppNav() {
  const pathname = usePathname();
  // Admin link for the owner only; the admin pages enforce access themselves.
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => (r.ok ? r.json() : { admin: false }))
      .then((j: { admin?: boolean }) => setIsAdmin(!!j.admin))
      .catch(() => {});
  }, []);
  const signedIn = useSession().status === "authenticated";
  const links = [
    ...LINKS,
    ...(signedIn ? [{ href: "/app/billing", label: "Plan", exact: false }] : []),
    ...(isAdmin ? [{ href: "/admin", label: "Admin", exact: false }] : []),
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-rule/70 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-3 sm:flex-row sm:justify-between sm:gap-3">
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto">
          <Link href="/" className="group flex min-w-0 items-center gap-2">
            <img src="/logo-mark.png" alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-md" />
            <span className="masthead-display text-lg leading-none text-ink group-hover:text-stamp">
              Back of the Box
            </span>
          </Link>
          {pathname === "/app/setup" ? (
            <button
              type="button"
              onClick={() => openSupportChat()}
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full px-3 text-sm font-semibold whitespace-nowrap text-ink-soft hover:bg-paper hover:text-ink sm:hidden"
            >
              Help
            </button>
          ) : null}
        </div>
        <nav aria-label="Parent app" className="flex w-full items-center justify-start gap-1 overflow-x-auto text-sm sm:w-auto sm:justify-end">
          {links.map((link) => {
            const active = link.exact
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-full px-3 py-1.5 whitespace-nowrap transition ${
                  active ? "bg-ink text-cream" : "text-ink-soft hover:bg-paper hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <span className="mx-1 h-5 w-px shrink-0 bg-rule/70" aria-hidden />
          <AuthButton compact />
        </nav>
      </div>
    </header>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex min-h-full flex-col bg-cream">
      <AppNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">
        {title ? (
          <div className="mb-6">
            <h1 className="font-display text-2xl tracking-tight text-ink sm:text-3xl">{title}</h1>
            {subtitle ? (
              <p className="mt-1 max-w-2xl text-sm text-ink-soft sm:text-base">{subtitle}</p>
            ) : null}
          </div>
        ) : null}
        {children}
      </main>
      <footer className="border-t border-rule/60 px-4 py-4 text-center text-xs text-ink-soft">
        Sign-in optional · kids get paper only
      </footer>
    </div>
  );
}
