"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface BarLinkProps {
  href: string;
  children: ReactNode;
  highlight?: "auto" | "off" | "on";
}

export default function BarLink({
  href,
  children,
  highlight = "auto",
}: BarLinkProps) {
  const pathname = usePathname();
  const isCurrent = href === "/" ? pathname === "/" : pathname.startsWith(href);
  const active =
    highlight === "on" ? true : highlight === "off" ? false : isCurrent;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors sm:px-3 sm:py-2 sm:text-sm ${
        active
          ? "bg-white/15 text-white hover:bg-white/25"
          : "text-white/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}
