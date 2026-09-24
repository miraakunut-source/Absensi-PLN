"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode } from "react";
import PlnMark from "@/components/brand/PlnMark";
import { logoutAdmin } from "@/lib/firebase";

interface AdminShellProps {
  children: ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/admin/dashboard"
      ? pathname === "/admin/dashboard" || pathname === "/admin"
      : pathname.startsWith(href);

  const handleLogout = () => {
    void (async () => {
      await logoutAdmin();
      await fetch("/api/admin/session", { method: "DELETE" });
      router.replace("/admin/login");
    })();
  };

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
        isActive(href)
          ? "bg-white/15 text-white"
          : "text-white/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b-4 border-gold-500 bg-brand-800">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <PlnMark href="/admin/dashboard" inverted />
          <nav className="flex flex-wrap items-center gap-1">
            {navLink("/admin/dashboard", "Dashboard")}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Keluar
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-500">
          Absensi digital PT PLN (Persero) UP3 Kediri
        </div>
      </footer>
    </div>
  );
}
