import type { ReactNode } from "react";

export type AlertTone = "info" | "success" | "warn" | "danger" | "error";

const TONES: Record<AlertTone, string> = {
  info: "border-l-brand-600 bg-brand-50 text-brand-900",
  success: "border-l-success-700 bg-success-50 text-success-800",
  warn: "border-l-warn-700 bg-warn-50 text-warn-800",
  danger: "border-l-danger-600 bg-danger-50 text-danger-800",
  error: "border-l-danger-600 bg-danger-50 text-danger-800",
};

interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Alert({
  tone = "info",
  title,
  children,
  className,
}: AlertProps) {
  const assertive = tone === "danger" || tone === "error" || tone === "warn";

  return (
    <div
      role={assertive ? "alert" : "status"}
      className={`rounded-md border border-line border-l-4 px-4 py-3 text-sm leading-relaxed ${TONES[tone]} ${
        className ?? ""
      }`}
    >
      {title ? (
        <p className="mb-1 font-bold text-ink">{title}</p>
      ) : null}
      {children}
    </div>
  );
}
