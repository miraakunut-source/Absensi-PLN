"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode } from "react";
import BrandBar from "@/components/brand/BrandBar";
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

  return (
    <div className="flex min-h-dvh flex-col">
      <BrandBar
        width="wide"
        trailing={
          <>
            <Link
              href="/admin/dashboard"
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                isActive("/admin/dashboard")
                  ? "bg-white/15 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              Keluar
            </button>
          </>
        }
      />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <p className="type-caption">
            Absensi digital PT PLN (Persero) UP3 Kediri
          </p>
        </div>
      </footer>
    </div>
  );
}
