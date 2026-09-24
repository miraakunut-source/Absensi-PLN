"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PrintButton from "./PrintButton";
import { buildCsvRows, downloadTextFile } from "@/lib/csvExport";
import { getConfig, listResponses } from "@/lib/formStorage";
import type { FormConfig, FormResponse, Question } from "@/types";

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
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-slate-500">
        Memuat rekap absensi...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="alert-error" role="alert">
          {error}
        </div>
        <Link
          href="/admin/dashboard"
          className="btn btn-secondary mt-5 inline-flex"
        >
          Kembali ke dashboard
        </Link>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-base font-bold text-ink">Form tidak ditemukan</p>
        <p className="mt-2 text-sm text-slate-600">
          Kegiatan mungkin sudah dihapus. Kembali ke dashboard untuk memilih
          kegiatan lain.
        </p>
        <Link
          href="/admin/dashboard"
          className="btn btn-secondary mt-5 inline-flex"
        >
          Kembali ke dashboard
        </Link>
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
      })
    : "tanggal belum diatur";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 print:hidden sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-700">Rekap absensi</p>
          <h1 className="page-title mt-1">{config.title}</h1>
          <p className="page-subtitle">
            {responses.length} peserta tercatat. Kegiatan {eventLabel}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/dashboard" className="btn btn-secondary">
            Dashboard
          </Link>
          <Link
            href={`/admin/form/${encodeURIComponent(formId)}/edit`}
            className="btn btn-secondary"
          >
            Edit form
          </Link>
          <button
            type="button"
            onClick={exportCsv}
            disabled={responses.length === 0}
            className="btn btn-secondary"
          >
            Unduh CSV
          </button>
          <PrintButton />
        </div>
      </div>

      {responses.length === 0 ? (
        <div className="panel mb-6 rounded-xl border-dashed px-4 py-12 text-center print:hidden">
          <p className="text-base font-bold text-ink">
            Belum ada peserta yang mengisi absensi
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
            Bagikan QR Code atau tautan kegiatan kepada peserta. Jawaban akan
            muncul di tabel ini setelah terkirim.
          </p>
        </div>
      ) : (
        <section className="panel mb-6 overflow-hidden rounded-xl print:hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">No</th>
                  <th className="px-4 py-3 font-semibold">Nama peserta</th>
                  <th className="px-4 py-3 font-semibold">Waktu kirim</th>
                  <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {responses.map((row, index) => {
                  const expanded = expandedId === row.id;
                  return (
                    <tr key={row.id} className="align-top">
                      <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold text-ink">
                        {respondentName(row)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDateTime(row.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(expanded ? null : row.id)
                          }
                          className="btn btn-secondary btn-sm"
                        >
                          {expanded ? "Tutup detail" : "Lihat detail"}
                        </button>
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
                    <div
                      key={`detail-${row.id}`}
                      className="border-t border-slate-200 bg-slate-50 px-4 py-5"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-ink">
                          Detail jawaban: {respondentName(row)}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setExpandedId(null)}
                          className="text-sm font-semibold text-brand-700 underline underline-offset-2"
                        >
                          Tutup
                        </button>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                        <dl className="space-y-3">
                          {columns.map((column) => (
                            <div
                              key={column.id}
                              className="grid gap-1 sm:grid-cols-[180px_1fr] sm:gap-3"
                            >
                              <dt className="text-sm font-semibold text-slate-600">
                                {column.label}
                              </dt>
                              <dd className="text-sm text-ink">
                                {displayValue(
                                  column,
                                  row.answers[column.id],
                                )}
                              </dd>
                            </div>
                          ))}
                        </dl>
                        <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
                          <p className="mb-2 text-xs font-semibold text-slate-600">
                            Tanda tangan
                          </p>
                          {signature ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={signature}
                              alt={`Tanda tangan ${respondentName(row)}`}
                              className="mx-auto max-h-32 w-auto object-contain"
                            />
                          ) : (
                            <p className="text-xs text-slate-400">-</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
            : null}
        </section>
      )}

      <section className="print-area mx-auto max-w-[210mm] bg-white p-6 shadow-lg print:max-w-none print:p-0 print:shadow-none">
        <header className="mb-6 flex items-center gap-4 border-b-4 border-double border-black pb-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-brand-800 text-3xl font-black text-gold-500 print:print-color-adjust-exact">
            PLN
          </div>
          <div className="flex-1 text-center text-black">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em]">
              PT PLN (PERSERO)
            </p>
            <h2 className="text-2xl font-black uppercase tracking-[0.2em]">
              UP3 Kediri
            </h2>
            <p className="text-[10px] leading-tight">
              Jl. Brawijaya, Kediri - Jawa Timur
            </p>
            <p className="text-[10px] leading-tight">www.pln.co.id</p>
          </div>
          <div className="h-16 w-16 shrink-0" aria-hidden />
        </header>

        <div className="mb-6 text-center text-black">
          <h3 className="text-base font-bold uppercase tracking-wide">
            Laporan Absensi Kegiatan
          </h3>
          <p className="mt-1 text-sm font-semibold">{config.title}</p>
          <p className="text-sm">Tanggal Kegiatan: {eventLabel}</p>
          <p className="text-xs text-slate-700">
            Periode pengisian: {period}
          </p>
          <p className="text-xs text-slate-700">
            Jumlah peserta: {responses.length}
          </p>
          <p className="text-xs text-slate-700">
            Nomor: .../UP3 KEDIRI/ABS/{currentWibYear()}
          </p>
        </div>

        {responses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-400 px-4 py-10 text-center text-sm text-slate-600">
            Belum ada data absensi untuk kegiatan ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[11px] text-black">
              <thead>
                <tr className="bg-slate-100 print:print-color-adjust-exact">
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

        <div className="mt-10 flex justify-between gap-8 text-black print:break-inside-avoid">
          <div className="text-[12px]">
            <p className="mb-1 font-semibold">Mengetahui,</p>
            <p>Kepala UP3 Kediri</p>
            <div className="mt-16 min-w-48 border-b border-dotted border-black" />
            <p className="mt-1 font-semibold">...............................</p>
            <p className="text-[11px]">NIP. ............................</p>
          </div>
          <div className="text-right text-[12px]">
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
