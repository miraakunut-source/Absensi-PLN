import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={`mb-6 flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between ${
        className ?? ""
      }`}
    >
      <div className="min-w-0">
        <h1 className="type-display break-words">{title}</h1>
        {description ? (
          <div className="type-body mt-2 max-w-2xl text-muted">
            {description}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex min-w-0 max-w-full flex-wrap gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
