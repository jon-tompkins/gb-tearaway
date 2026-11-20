import Link from "next/link";

export function FreeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-cream">
      <header className="mx-auto flex max-w-xl items-center px-4 py-5">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" width={32} height={32} className="h-8 w-8 rounded-md" />
          <span className="masthead-display text-lg">Back of the Box</span>
        </Link>
      </header>
      <main className="mx-auto max-w-xl px-4 pb-16">{children}</main>
    </div>
  );
}
