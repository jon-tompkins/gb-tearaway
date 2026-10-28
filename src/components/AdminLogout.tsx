"use client";

export function AdminLogout() {
  return (
    <button
      type="button"
      className="ml-auto px-3 py-2 text-xs font-semibold text-ink-soft hover:text-ink"
      onClick={async () => {
        await fetch("/api/admin/login", { method: "DELETE" });
        window.location.href = "/admin/login";
      }}
    >
      Lock admin
    </button>
  );
}
