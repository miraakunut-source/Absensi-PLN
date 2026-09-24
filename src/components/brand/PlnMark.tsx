import Link from "next/link";

interface PlnMarkProps {
  href?: string | null;
  inverted?: boolean;
  compact?: boolean;
}

export default function PlnMark({
  href = null,
  inverted = false,
  compact = false,
}: PlnMarkProps) {
  const content = (
    <span className="inline-flex items-center gap-3">
      <span
        aria-hidden
        className={`flex shrink-0 items-center justify-center rounded-md ${
          compact ? "h-8 w-8" : "h-10 w-10"
        } ${inverted ? "bg-white/10 ring-1 ring-white/25" : "bg-brand-700"}`}
      >
        <svg
          viewBox="0 0 24 24"
          className={compact ? "h-4 w-4" : "h-5 w-5"}
          fill="none"
          aria-hidden
        >
          <path
            d="M13.2 2.5 5.8 13.1h5.1L10 21.5l7.7-11.2h-5.2l.7-7.8Z"
            fill="#FDBC12"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-tight">
        <span
          className={`text-sm font-extrabold ${inverted ? "text-white" : "text-brand-800"}`}
        >
          PLN UP3 Kediri
        </span>
        {!compact ? (
          <span
            className={`text-xs font-medium ${inverted ? "text-white/70" : "text-slate-500"}`}
          >
            Sistem Absensi Kegiatan
          </span>
        ) : null}
      </span>
    </span>
  );

  if (!href) {
    return <span className="inline-block">{content}</span>;
  }

  return (
    <Link href={href} className="rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500">
      {content}
    </Link>
  );
}
