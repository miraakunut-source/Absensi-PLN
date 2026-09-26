"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode } from "react";
import AppFooter from "@/components/brand/AppFooter";
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
              aria-label="Keluar"
              title="Keluar"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden
              >
                <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
                <path d="M10 17l-5-5 5-5" />
                <path d="M5 12h11" />
              </svg>
            </button>
          </>
        }
      />
      <main className="flex-1">{children}</main>
      <AppFooter />
    </div>
  );
}
