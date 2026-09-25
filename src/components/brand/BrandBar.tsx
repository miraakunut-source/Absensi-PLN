import type { ReactNode } from "react";
import PlnMark from "./PlnMark";

interface BrandBarProps {
  trailing?: ReactNode;
  children?: ReactNode;
}

export default function BrandBar({ trailing, children }: BrandBarProps) {
  return (
    <header className="border-t-[3px] border-gold-500 bg-brand-800">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <PlnMark inverted />
        {trailing ? (
          <div className="ml-auto flex flex-wrap items-center gap-1">{trailing}</div>
        ) : null}
        {children}
      </div>
    </header>
  );
}
