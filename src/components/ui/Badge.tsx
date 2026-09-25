import type { ReactNode } from "react";

export type BadgeTone =
  | "neutral"
  | "brand"
  | "gold"
  | "success"
  | "warn"
  | "danger";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-sunken text-body",
  brand: "bg-brand-50 text-brand-800",
  gold: "bg-gold-100 text-gold-800",
  success: "bg-success-50 text-success-800",
  warn: "bg-warn-50 text-warn-800",
  danger: "bg-danger-50 text-danger-800",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

export default function Badge({
  tone = "neutral",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
        TONES[tone]
      } ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
