"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import EventHeader from "@/components/public/EventHeader";
import PublicShell from "@/components/public/PublicShell";
import StatusPanel from "@/components/public/StatusPanel";
import FormViewer from "@/components/form/FormViewer";
import { getOpenStateMessage } from "@/lib/formStatus";
import type { FormConfig, FormOpenState } from "@/types";

interface PublicFormResponse {
  config?: FormConfig;
  openState?: FormOpenState;
  error?: string;
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="animate-pulse rounded-lg border border-line bg-surface p-5 sm:p-7">
        <div className="h-3 w-32 rounded bg-sunken" />
        <div className="mt-3 h-7 w-3/4 rounded bg-sunken" />
        <div className="mt-6 h-2 w-full rounded bg-sunken" />
        <div className="mt-8 space-y-4">
          <div className="h-11 w-full rounded-lg bg-sunken" />
          <div className="h-11 w-full rounded-lg bg-sunken" />
        </div>
      </div>
      <p className="type-caption mt-4">{label}</p>
    </div>
  );
}

function AbsenFormContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const preview = searchParams.get("preview") === "1";
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [openState, setOpenState] = useState<FormOpenState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const query = `token=${encodeURIComponent(id)}&id=${encodeURIComponent(id)}`;
        const response = await fetch(`/api/public/form?${query}`);
        if (response.status === 404) {
          if (cancelled) return;
          setError("not_found");
          return;
        }
        if (!response.ok) {
          const failed = (await response
            .json()
            .catch(() => ({}))) as PublicFormResponse;
          throw new Error(
            failed.error || "Formulir gagal dimuat. Periksa koneksi internet Anda.",
          );
        }
        const data = (await response.json()) as PublicFormResponse;
        if (cancelled) return;
        if (!data.config || !data.openState) {
          setError("not_found");
          return;
        }
        setConfig(data.config);
        setOpenState(data.openState);
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Formulir gagal dimuat. Periksa koneksi internet Anda lalu muat ulang halaman.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <LoadingPanel label="Memuat formulir absensi..." />;
  }

  if (error === "not_found" || !config) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <StatusPanel
          tone="error"
          title="Form tidak ditemukan"
          message={
            error === "not_found"
              ? "QR Code atau tautan ini tidak terdaftar. Pastikan Anda memindai QR resmi dari panitia, atau minta tautan absensi terbaru kepada panitia kegiatan."
              : (error ?? "Formulir ini tidak dapat dimuat.")
          }
        />
      </div>
    );
  }

  const blocked = openState !== null && openState !== "open";

  if (blocked && !preview) {
    const titles: Record<string, string> = {
      closed_manual: "Absensi sudah ditutup",
      not_started: "Absensi belum dibuka",
      deadline_passed: "Batas waktu absensi berakhir",
      max_reached: "Kuota peserta sudah penuh",
    };
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <StatusPanel
          tone="warn"
          title={titles[openState ?? ""] ?? "Absensi tidak dapat diisi"}
          message={
            openState
              ? `${getOpenStateMessage(openState)} Hubungi panitia kegiatan jika Anda merasa seharusnya masih dapat mengisi absensi.`
              : "Formulir ini sedang tidak menerima pengisian. Hubungi panitia kegiatan untuk informasi lebih lanjut."
          }
        />
      </div>
    );
  }

  const allowFill = openState === "open";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
      <div className="mx-auto w-full max-w-2xl">
        <EventHeader
          title={config.title}
          description={config.description}
          eventDate={config.eventDate}
          note={
            preview && openState && openState !== "open" ? (
              <div className="rounded-md border border-warn-200 bg-warn-50 px-4 py-3 text-sm text-warn-800">
                Mode pratinjau: status form saat ini{" "}
                <strong>{getOpenStateMessage(openState) || openState}</strong>.
                Pengisian dan pengiriman dinonaktifkan.
              </div>
            ) : null
          }
        />
        <div className="mt-5">
          <FormViewer config={config} disabled={!allowFill} />
        </div>
      </div>
    </div>
  );
}

export default function AbsenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void params.then((value) => {
      if (!cancelled) setId(value.id);
    });
    return () => {
      cancelled = true;
    };
  }, [params]);

  if (!id) {
    return (
      <PublicShell>
        <LoadingPanel label="Memuat..." />
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <Suspense fallback={<LoadingPanel label="Memuat formulir..." />}>
        <AbsenFormContent id={id} />
      </Suspense>
    </PublicShell>
  );
}
