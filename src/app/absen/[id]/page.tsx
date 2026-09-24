"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import EventHeader from "@/components/public/EventHeader";
import PublicShell from "@/components/public/PublicShell";
import StatusPanel from "@/components/public/StatusPanel";
import FormViewer from "@/components/form/FormViewer";
import { getConfig, getConfigByToken } from "@/lib/formStorage";
import { getFormOpenState, getOpenStateMessage } from "@/lib/formStatus";
import type { FormConfig, FormOpenState } from "@/types";

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="panel animate-pulse rounded-xl p-6">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="mt-3 h-7 w-3/4 rounded bg-slate-200" />
        <div className="mt-6 space-y-3">
          <div className="h-4 w-full rounded bg-slate-100" />
          <div className="h-11 w-full rounded-lg bg-slate-100" />
          <div className="h-4 w-2/3 rounded bg-slate-100" />
          <div className="h-11 w-full rounded-lg bg-slate-100" />
        </div>
        <p className="mt-6 text-sm text-slate-500">{label}</p>
      </div>
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
        const existing = (await getConfigByToken(id)) ?? (await getConfig(id));
        if (cancelled) return;
        if (!existing) {
          setError("not_found");
          return;
        }
        const { countResponses } = await import("@/lib/formStorage");
        const count = await countResponses(existing.id);
        if (cancelled) return;
        setConfig(existing);
        setOpenState(getFormOpenState(existing, count));
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
      <div className="mx-auto max-w-2xl px-4 py-10">
        <StatusPanel
          tone="error"
          title="Form tidak ditemukan"
          message={
            error === "not_found"
              ? "QR Code atau tautan ini tidak terdaftar. Pastikan Anda memindai QR resmi dari panitia, atau minta tautan absensi terbaru kepada panitia kegiatan."
              : (error ?? "Formulir tidak dapat dimuat.")
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
      <div className="mx-auto max-w-2xl px-4 py-10">
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
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
      <EventHeader
        title={config.title}
        description={config.description}
        eventDate={config.eventDate}
        note={
          preview && openState && openState !== "open" ? (
            <div className="alert-warn">
              Mode pratinjau: status form saat ini{" "}
              <strong>{getOpenStateMessage(openState) || openState}</strong>.
              Pengisian dan pengiriman dinonaktifkan.
            </div>
          ) : null
        }
      />
      <FormViewer config={config} disabled={!allowFill} />
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
