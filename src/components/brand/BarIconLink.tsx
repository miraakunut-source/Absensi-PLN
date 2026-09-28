"use client";

import Link from "next/link";
import type { ReactNode } from "react";

interface BarIconLinkProps {
  href: string;
  label: string;
  children: ReactNode;
}

export default function BarIconLink({ href, label, children }: BarIconLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/80 transition duration-150 hover:text-white active:scale-95 active:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
    >
      {children}
    </Link>
  );
}
