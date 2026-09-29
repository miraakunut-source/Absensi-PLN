"use client";

import { useEffect, useState } from "react";
import PublicShell from "@/components/public/PublicShell";
import StatusPanel from "@/components/public/StatusPanel";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface Activity {
  id: string;
  token: string;
  title: string;
  description: string;
  eventDate: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "Tanggal belum diatur";
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

export default function AbsenIndexPage() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/public/active-forms");
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(
            data.error || "Daftar kegiatan gagal dimuat. Periksa koneksi Anda.",
          );
        }
        const data = (await response.json()) as { activities?: Activity[] };
        if (cancelled) return;
        setActivities(data.activities ?? []);
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Daftar kegiatan gagal dimuat. Periksa koneksi Anda.",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        <div className="mx-auto w-full max-w-2xl">
          <div className="border-b border-line pb-5">
          <p className="type-caption text-brand-700">Absensi kegiatan</p>
          <h1 className="type-display mt-2">Pilih kegiatan</h1>
          <p className="type-body mt-3 text-muted">
            Daftar kegiatan yang sedang menerima absensi. Pilih kegiatan yang
            sedang Anda ikuti.
          </p>
        </div>

        {error ? (
          <div className="mt-5">
            <Alert tone="danger">{error}</Alert>
          </div>
        ) : activities === null ? (
          <div className="mt-5 space-y-3" aria-busy="true">
            <div className="h-24 animate-pulse rounded-lg bg-sunken" />
            <div className="h-24 animate-pulse rounded-lg bg-sunken" />
          </div>
        ) : activities.length === 0 ? (
          <div className="mt-5">
            <StatusPanel
              tone="info"
              title="Belum ada kegiatan yang dibuka"
              message="Saat ini belum ada kegiatan yang menerima absensi. Hubungi panitia kegiatan untuk informasi jadwal terbaru."
            />
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {activities.map((activity) => (
              <li key={activity.id}>
                <Card className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="type-heading min-w-0 break-words">
                      {activity.title}
                    </h2>
                    <Badge tone="success">Dibuka</Badge>
                  </div>
                  <p className="type-caption mt-1">
                    {formatDate(activity.eventDate)}
                  </p>
                  {activity.description ? (
                    <p className="type-body mt-2 text-muted">
                      {activity.description}
                    </p>
                  ) : null}
                  <Button
                    href={`/absen/${encodeURIComponent(activity.token)}`}
                    fullWidth
                    className="mt-3"
                  >
                    Isi absensi
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
        </div>
      </div>
    </PublicShell>
  );
}
