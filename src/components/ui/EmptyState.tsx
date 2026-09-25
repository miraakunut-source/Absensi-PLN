import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}

export default function EmptyState({
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={compact ? "px-5 py-8 text-center" : "px-5 py-14 text-center"}>
      <p className="type-heading">{title}</p>
      <div className="type-body mx-auto mt-2 max-w-md text-muted">
        {description}
      </div>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
