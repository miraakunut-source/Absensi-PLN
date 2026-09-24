interface StatusPanelProps {
  tone?: "warn" | "error" | "info";
  title: string;
  message: string;
  action?: React.ReactNode;
}

export default function StatusPanel({
  tone = "warn",
  title,
  message,
  action,
}: StatusPanelProps) {
  const tones = {
    warn: {
      box: "border-amber-200 bg-amber-50",
      icon: "bg-amber-500",
      title: "text-amber-950",
      body: "text-amber-900",
    },
    error: {
      box: "border-red-200 bg-red-50",
      icon: "bg-red-600",
      title: "text-red-950",
      body: "text-red-800",
    },
    info: {
      box: "border-brand-200 bg-brand-50",
      icon: "bg-brand-600",
      title: "text-brand-950",
      body: "text-brand-900",
    },
  }[tone];

  return (
    <div className={`rounded-xl border p-6 sm:p-8 ${tones.box}`}>
      <div className="flex gap-4">
        <span
          aria-hidden
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${tones.icon}`}
        >
          !
        </span>
        <div className="min-w-0">
          <h2 className={`text-lg font-bold ${tones.title}`}>{title}</h2>
          <p className={`mt-1.5 text-sm leading-relaxed ${tones.body}`}>
            {message}
          </p>
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
