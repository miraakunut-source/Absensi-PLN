interface ProgressStepsProps {
  current: number;
  total: number;
  label?: string;
}

export default function ProgressSteps({
  current,
  total,
  label,
}: ProgressStepsProps) {
  const safeTotal = Math.max(total, 1);
  const step = Math.min(Math.max(current, 1), safeTotal);

  return (
    <div>
      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={safeTotal}
        aria-label={label ?? "Progres pengisian"}
      >
        {Array.from({ length: safeTotal }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full ${
              index < step ? "bg-brand-600" : "bg-sunken"
            }`}
          />
        ))}
      </div>
      <p className="type-caption mt-2">
        {label ?? "Halaman"} {step} dari {safeTotal}
      </p>
    </div>
  );
}
