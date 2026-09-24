interface EventHeaderProps {
  title: string;
  description?: string | null;
  eventDate?: string | null;
  note?: React.ReactNode;
}

function formatDate(iso: string): string {
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    });
  } catch {
    return iso;
  }
}

export default function EventHeader({
  title,
  description,
  eventDate,
  note,
}: EventHeaderProps) {
  return (
    <div className="mb-5">
      <p className="text-sm font-semibold text-brand-700">Formulir absensi</p>
      <h1 className="mt-1 text-2xl font-bold leading-snug tracking-tight text-ink sm:text-3xl">
        {title}
      </h1>
      {eventDate ? (
        <p className="mt-2 text-sm text-slate-600">
          Tanggal kegiatan:{" "}
          <span className="font-semibold text-slate-800">
            {formatDate(eventDate)}
          </span>
        </p>
      ) : null}
      {description ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {description}
        </p>
      ) : null}
      {note ? <div className="mt-4">{note}</div> : null}
    </div>
  );
}
