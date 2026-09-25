import type { ReactNode } from "react";
import PlnMark from "./PlnMark";

interface BrandBarProps {
  trailing?: ReactNode;
  width?: "narrow" | "wide";
  children?: ReactNode;
}

export default function BrandBar({
  trailing,
  width = "narrow",
  children,
}: BrandBarProps) {
  return (
    <header className="border-t-[3px] border-gold-500 bg-brand-800">
      <div
        className={`mx-auto flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 ${
          width === "narrow" ? "max-w-2xl" : "max-w-6xl"
        }`}
      >
        <PlnMark inverted />
        {trailing ? (
          <div className="ml-auto flex flex-wrap items-center gap-1">{trailing}</div>
        ) : null}
        {children}
      </div>
    </header>
  );
}
