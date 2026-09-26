"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface BarLinkProps {
  href: string;
  children: ReactNode;
}

export default function BarLink({ href, children }: BarLinkProps) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
        active
          ? "bg-white/15 text-white"
          : "text-white/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}
