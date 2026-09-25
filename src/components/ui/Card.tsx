import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  tone?: "surface" | "sunken" | "transparent";
}

const TONES: Record<NonNullable<CardProps["tone"]>, string> = {
  surface: "border border-line bg-surface",
  sunken: "border border-line bg-sunken",
  transparent: "",
};

export default function Card({
  children,
  className,
  tone = "surface",
}: CardProps) {
  return (
    <div
      className={`rounded-lg shadow-panel print:shadow-none ${TONES[tone]} ${
        className ?? ""
      }`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function CardHeader({
  title,
  description,
  actions,
  className,
}: CardHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
        className ?? ""
      }`}
    >
      <div className="min-w-0">
        <h2 className="type-heading">{title}</h2>
        {description ? (
          <p className="type-caption mt-1">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`px-5 py-5 ${className ?? ""}`}>{children}</div>;
}

export function CardFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border-t border-line px-5 py-4 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
