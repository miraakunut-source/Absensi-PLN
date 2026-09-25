"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card, { CardFooter, CardHeader } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { buildCsvRows, downloadTextFile } from "@/lib/csvExport";
import { getConfig, listResponses } from "@/lib/formStorage";
import type { FormConfig, FormResponse, Question } from "@/types";
import PrintButton from "./PrintButton";

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatDateTime(value: string): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function currentWibYear(): number {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).getUTCFullYear();
}

function displayValue(
  question: Question,
  value: string | string[] | undefined,
): string {
  if (value === undefined || value === null) return "-";
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "-";
  }
  return value.trim() === "" ? "-" : value;
}

function respondentName(row: FormResponse): string {
  const value = row.answers.nama;
  if (Array.isArray(value)) return value.join(", ");
  if (value && value.trim()) return value;
  return row.respondentName || "-";
}

interface ResponsesViewProps {
  formId: string;
}

export default function ResponsesView({ formId }: ResponsesViewProps) {
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [formConfig, rows] = await Promise.all([
          getConfig(formId),
          listResponses(formId),
        ]);
        if (cancelled) return;
        setConfig(formConfig);
        setResponses(rows);
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Gagal memuat rekap absensi. Muat ulang halaman atau periksa koneksi.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [formId]);

  const columns = useMemo(() => config?.questions ?? [], [config]);

  const exportCsv = () => {
    const headers = [
      "No",
      "Waktu Kirim",
      "Nama",
      ...columns.map((column) => column.label),
      "URL TTD",
    ];
    const rows = responses.map((row, index) => [
      index + 1,
      formatDateTime(row.createdAt),
      respondentName(row),
      ...columns.map((column) =>
        displayValue(column, row.answers[column.id]),
      ),
      row.signatureUrl || row.signatureDataUrl || "",
    ]);
    const csv = buildCsvRows(headers, rows);
    const safeTitle = (config?.title ?? formId)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    downloadTextFile(`absensi-${safeTitle || "kegiatan"}.csv`, csv, "text/csv");
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 text-center sm:py-8">
        <p className="type-body text-muted">Memuat rekap absensi...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Alert tone="danger">{error}</Alert>
        <div className="mt-5">
          <Button href="/admin/dashboard" variant="secondary">
            Kembali ke dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Card>
          <EmptyState
            compact
            title="Form tidak ditemukan"
            description="Kegiatan mungkin sudah dihapus. Kembali ke dashboard untuk memilih kegiatan lain."
            action={
              <Button href="/admin/dashboard" variant="secondary">
                Kembali ke dashboard
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const period =
    responses.length > 0
      ? `${formatDate(responses[responses.length - 1].createdAt)} sampai ${formatDate(responses[0].createdAt)}`
      : "-";

  const eventLabel = config.eventDate
    ? new Date(`${config.eventDate}T00:00:00`).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      })
    : "tanggal belum diatur";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
      <PageHeader
        title={config.title}
        description={`${responses.length} peserta tercatat. Kegiatan ${eventLabel}.`}
        className="print:hidden"
        actions={
          <>
            <Button href="/admin/dashboard" variant="secondary">
              Dashboard
            </Button>
            <Button
              href={`/admin/form/${encodeURIComponent(formId)}/edit`}
              variant="secondary"
            >
              Edit form
            </Button>
            <Button
              onClick={exportCsv}
              variant="secondary"
              disabled={responses.length === 0}
            >
              Unduh CSV
            </Button>
            <PrintButton />
          </>
        }
      />

      {responses.length === 0 ? (
        <Card className="mb-6 print:hidden">
          <EmptyState
            compact
            title="Belum ada peserta yang mengisi absensi"
            description="Bagikan QR Code atau tautan kegiatan kepada peserta. Jawaban akan muncul di tabel ini setelah terkirim."
          />
        </Card>
      ) : (
        <Card className="mb-6 overflow-hidden print:hidden">
          <CardHeader
            title="Rekap peserta"
            description={
              period === "-"
                ? "Periode pengisian akan tampil setelah ada jawaban."
                : `Periode pengisian: ${period}`
            }
            actions={<Badge tone="brand">{responses.length} peserta</Badge>}
          />

          <div className="overflow-x-auto">
            <table className="type-body w-full min-w-[720px] text-left">
              <thead className="border-b border-line bg-sunken">
                <tr>
                  <th scope="col" className="type-label px-4 py-3">
                    No
                  </th>
                  <th scope="col" className="type-label px-4 py-3">
                    Nama peserta
                  </th>
                  <th scope="col" className="type-label px-4 py-3">
                    Waktu kirim
                  </th>
                  <th
                    scope="col"
                    className="type-label px-4 py-3 text-right"
                  >
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {responses.map((row, index) => {
                  const expanded = expandedId === row.id;
                  return (
                    <tr key={row.id} className="align-top">
                      <td className="px-4 py-3 text-muted">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold text-ink">
                        {respondentName(row)}
                      </td>
                      <td className="px-4 py-3 text-body">
                        {formatDateTime(row.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          onClick={() =>
                            setExpandedId(expanded ? null : row.id)
                          }
                          variant="secondary"
                          size="sm"
                        >
                          {expanded ? "Tutup detail" : "Lihat detail"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {expandedId
            ? responses
                .filter((row) => row.id === expandedId)
                .map((row) => {
                  const signature =
                    row.signatureUrl || row.signatureDataUrl || null;
                  return (
                    <CardFooter key={`detail-${row.id}`} className="bg-sunken">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="type-heading min-w-0 break-words">
                          Detail jawaban: {respondentName(row)}
                        </h3>
                        <Button
                          onClick={() => setExpandedId(null)}
                          variant="ghost"
                          size="sm"
                        >
                          Tutup
                        </Button>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                        <dl className="space-y-3">
                          {columns.map((column) => (
                            <div
                              key={column.id}
                              className="grid gap-1 sm:grid-cols-[180px_1fr] sm:gap-3"
                            >
                              <dt className="type-label break-words">
                                {column.label}
                              </dt>
                              <dd className="type-body min-w-0 break-words">
                                {displayValue(
                                  column,
                                  row.answers[column.id],
                                )}
                              </dd>
                            </div>
                          ))}
                        </dl>
                        <div className="rounded-lg border border-line bg-surface p-3 text-center shadow-panel">
                          <p className="type-label mb-2">Tanda tangan</p>
                          {signature ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={signature}
                              alt={`Tanda tangan ${respondentName(row)}`}
                              className="mx-auto max-h-32 max-w-full w-auto object-contain"
                            />
                          ) : (
                            <p className="type-caption">-</p>
                          )}
                        </div>
                      </div>
                    </CardFooter>
                  );
                })
            : null}
        </Card>
      )}

      <section className="print-area mx-auto max-w-[210mm] border border-line bg-white p-6 text-black print:max-w-none print:border-0 print:p-0 print:shadow-none">
        <header className="mb-6 flex items-center gap-3 border-b-4 border-double border-black pb-4 sm:gap-4">
          <Image
            src="/logo-pln.png"
            alt="Logo PLN"
            width={64}
            height={64}
            className="h-12 w-12 shrink-0 print:print-color-adjust-exact sm:h-16 sm:w-16"
          />
          <div className="min-w-0 flex-1 text-center text-black">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em]">
              PT PLN (PERSERO)
            </p>
            <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-black">
              UP3 Kediri
            </h2>
            <p className="text-[10px] leading-tight">
              Jl. Brawijaya, Kediri - Jawa Timur
            </p>
            <p className="text-[10px] leading-tight">www.pln.co.id</p>
          </div>
          <div className="h-12 w-12 shrink-0 sm:h-16 sm:w-16" aria-hidden />
        </header>

        <div className="mb-6 text-center text-black">
          <h3 className="text-base font-bold uppercase tracking-wide text-black">
            Laporan Absensi Kegiatan
          </h3>
          <p className="mt-1 text-sm font-semibold break-words">
            {config.title}
          </p>
          <p className="text-sm">Tanggal Kegiatan: {eventLabel}</p>
          <p className="text-xs text-black">
            Periode pengisian: {period}
          </p>
          <p className="text-xs text-black">
            Jumlah peserta: {responses.length}
          </p>
          <p className="text-xs text-black">
            Nomor: .../UP3 KEDIRI/ABS/{currentWibYear()}
          </p>
        </div>

        {responses.length === 0 ? (
          <div className="border border-dashed border-black bg-white px-4 py-10 text-center text-sm text-black">
            Belum ada data absensi untuk kegiatan ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[11px] text-black">
              <thead>
                <tr className="bg-white print:print-color-adjust-exact">
                  <th className="border border-black px-2 py-2 text-center">
                    No
                  </th>
                  <th className="border border-black px-2 py-2 text-left">
                    Nama Peserta
                  </th>
                  {columns.map((column) => (
                    <th
                      key={column.id}
                      className="border border-black px-2 py-2 text-left"
                    >
                      {column.label}
                    </th>
                  ))}
                  <th className="border border-black px-2 py-2 text-center">
                    Tanda Tangan
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...responses].reverse().map((row, index) => {
                  const signature =
                    row.signatureUrl || row.signatureDataUrl || null;
                  return (
                    <tr key={row.id} className="align-top">
                      <td className="border border-black px-2 py-2 text-center">
                        {index + 1}
                      </td>
                      <td className="border border-black px-2 py-2 font-medium">
                        {respondentName(row)}
                      </td>
                      {columns.map((column) => (
                        <td
                          key={column.id}
                          className="border border-black px-2 py-2"
                        >
                          {displayValue(column, row.answers[column.id])}
                        </td>
                      ))}
                      <td className="border border-black px-2 py-2 text-center">
                        {signature ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={signature}
                            alt={`TTD ${respondentName(row)}`}
                            className="mx-auto h-12 w-auto object-contain"
                          />
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-10 flex flex-col gap-8 text-black print:break-inside-avoid sm:flex-row sm:justify-between">
          <div className="text-[12px]">
            <p className="mb-1 font-semibold">Mengetahui,</p>
            <p>Kepala UP3 Kediri</p>
            <div className="mt-16 min-w-48 border-b border-dotted border-black" />
            <p className="mt-1 font-semibold">...............................</p>
            <p className="text-[11px]">NIP. ............................</p>
          </div>
          <div className="text-left text-[12px] sm:text-right">
            <p>Kediri, {formatLongDate(new Date())}</p>
            <p className="mt-1">Petugas Rekap Absensi</p>
            <div className="ml-auto mt-16 min-w-48 border-b border-dotted border-black" />
            <p className="mt-1 font-semibold">...............................</p>
            <p className="text-[11px]">NIP. ............................</p>
          </div>
        </div>
      </section>
    </div>
  );
}
