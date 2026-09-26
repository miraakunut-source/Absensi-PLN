import type { ReactNode } from "react";
import PlnMark from "./PlnMark";

interface BrandBarProps {
  trailing?: ReactNode;
  topRight?: ReactNode;
  children?: ReactNode;
}

export default function BrandBar({
  trailing,
  topRight,
  children,
}: BrandBarProps) {
  const links = trailing || children;

  return (
    <header className="border-t-[3px] border-gold-500 bg-brand-800">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 sm:gap-3">
        <PlnMark inverted />
        {links ? (
          <div className="ml-auto flex min-w-0 items-center gap-1">
            {trailing}
            {children}
          </div>
        ) : null}
        {topRight ? (
          <div className={links ? "" : "ml-auto shrink-0"}>{topRight}</div>
        ) : null}
      </div>
    </header>
  );
}
