import Image from "next/image";
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
  const size = compact ? 32 : 40;

  const content = (
    <span className="inline-flex items-center gap-3">
      <Image
        src="/logo-pln.png"
        alt=""
        aria-hidden
        width={size}
        height={size}
        preload
        className="shrink-0"
      />
      <span className="flex flex-col leading-tight">
        <span
          className={`text-sm font-extrabold ${inverted ? "text-white" : "text-brand-800"}`}
        >
          PLN UP3 Kediri
        </span>
        {!compact ? (
          <span
            className={`type-caption ${inverted ? "text-white/70" : ""}`}
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
    <Link
      href={href}
      className="rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
    >
      {content}
    </Link>
  );
}
