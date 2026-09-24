"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthButton } from "./AuthButton";

const LINKS = [
  { href: "/app", label: "Today", exact: true },
  { href: "/app/settings", label: "Settings" },
  { href: "/app/setup", label: "Add kid" },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-rule/70 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-3 sm:flex-row sm:justify-between sm:gap-3">
        <Link href="/" className="group flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-ink text-[0.7rem] font-bold tracking-tight text-cream shadow-sm"
          >
            B
          </span>
          <span className="masthead-display text-lg leading-none text-ink group-hover:text-stamp">
            Back of the Box
          </span>
        </Link>
        <nav aria-label="Parent app" className="flex w-full items-center justify-center gap-1 overflow-x-auto text-sm sm:w-auto sm:justify-end">
          {LINKS.map((link) => {
            const active = link.exact
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-1.5 whitespace-nowrap transition ${
                  active ? "bg-ink text-cream" : "text-ink-soft hover:bg-paper hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <span className="mx-1 h-5 w-px bg-rule/70" aria-hidden />
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
