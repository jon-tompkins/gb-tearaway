import Link from "next/link";

const TABS = [
  { href: "/admin", label: "Modules", key: "modules" },
  { href: "/admin/usage", label: "Usage", key: "usage" },
  { href: "/admin/accounts", label: "Accounts", key: "accounts" },
  { href: "/admin/codes", label: "Plans & codes", key: "codes" },
  { href: "/admin/marketing", label: "Marketing", key: "marketing" },
  { href: "/admin/support", label: "Support", key: "support" },
] as const;

export function AdminTabs({ active }: { active: (typeof TABS)[number]["key"] }) {
  return (
    <div className="mb-6 flex gap-1 border-b border-rule">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={`-mb-px rounded-t-lg border px-4 py-2 text-sm font-semibold ${
            t.key === active
              ? "border-rule border-b-cream bg-cream text-ink"
              : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
