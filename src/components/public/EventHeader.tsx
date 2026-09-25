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
    <div className="border-b border-line pb-6">
      <p className="type-caption text-brand-700">Formulir absensi kegiatan</p>
      <h1 className="type-display mt-2">{title}</h1>
      {eventDate ? (
        <p className="type-body mt-3 text-muted">
          <span className="font-semibold text-body">Tanggal kegiatan:</span>{" "}
          {formatDate(eventDate)}
        </p>
      ) : null}
      {description ? (
        <p className="type-body mt-3 text-muted">{description}</p>
      ) : null}
      {note ? <div className="mt-4">{note}</div> : null}
    </div>
  );
}
