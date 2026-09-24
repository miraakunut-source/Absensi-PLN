"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { deleteForm, listForms, listResponses } from "@/lib/formStorage";
import { getFormOpenState, getOpenStateMessage } from "@/lib/formStatus";
import type { FormConfig } from "@/types";

interface DashboardStats {
  totalForms: number;
  openForms: number;
  totalParticipants: number;
}

function formatEventDate(value?: string | null): string {
  if (!value) return "Tanggal belum diatur";
  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    });
  } catch {
    return value;
  }
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [forms, setForms] = useState<FormConfig[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const list = await listForms();
        const entries = await Promise.all(
          list.map(async (form) => {
            try {
              const rows = await listResponses(form.id);
              return [form.id, rows.length] as const;
            } catch {
              return [form.id, 0] as const;
            }
          }),
        );
        if (cancelled) return;
        setForms(list);
        setCounts(Object.fromEntries(entries));
        setLoading(false);
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Gagal memuat data kegiatan. Muat ulang halaman atau periksa koneksi.",
        );
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats: DashboardStats = {
    totalForms: forms.length,
    openForms: forms.filter(
      (form) => getFormOpenState(form, counts[form.id] ?? 0) === "open",
    ).length,
    totalParticipants: Object.values(counts).reduce(
      (sum, value) => sum + value,
      0,
    ),
  };

  const handleCreate = async () => {
    setBusyId("new");
    try {
      const { createForm } = await import("@/lib/formStorage");
      const form = await createForm({
        title: "Kegiatan Absensi Baru",
      });
      router.push(`/admin/form/${encodeURIComponent(form.id)}/edit`);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Gagal membuat form baru. Coba lagi.",
      );
      setBusyId(null);
    }
  };

  const toggleStatus = async (form: FormConfig) => {
    setBusyId(form.id);
    try {
      const next: FormConfig = {
        ...form,
        status: form.status === "open" ? "closed" : "open",
      };
      const { saveConfig } = await import("@/lib/formStorage");
      await saveConfig(next);
      setForms((current) =>
        current.map((item) => (item.id === form.id ? next : item)),
      );
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Status form gagal diperbarui. Coba lagi.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (form: FormConfig) => {
    if (
      !window.confirm(
        `Hapus kegiatan "${form.title}" beserta seluruh jawaban peserta? Tindakan ini tidak dapat dibatalkan.`,
      )
    ) {
      return;
    }
    setBusyId(form.id);
    try {
      await deleteForm(form.id);
      setForms((current) => current.filter((item) => item.id !== form.id));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Kegiatan gagal dihapus. Coba lagi.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const statItems = [
    {
      label: "Kegiatan dibuka",
      value: stats.openForms,
      hint: `dari ${stats.totalForms} kegiatan`,
      accent: "border-l-brand-600",
      valueClass: "text-brand-700",
    },
    {
      label: "Total kegiatan",
      value: stats.totalForms,
      hint: "semua form absensi",
      accent: "border-l-slate-400",
      valueClass: "text-ink",
    },
    {
      label: "Total peserta",
      value: stats.totalParticipants,
      hint: "jawaban terkumpul",
      accent: "border-l-gold-500",
      valueClass: "text-gold-700",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Dashboard absensi</h1>
          <p className="page-subtitle">
            Ringkasan kegiatan, jumlah peserta, dan kontrol buka atau tutup form
            peserta.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void handleCreate();
          }}
          disabled={busyId === "new"}
          className="btn btn-primary sm:w-auto"
        >
          {busyId === "new" ? "Membuat form..." : "Buat kegiatan baru"}
        </button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {statItems.map((item) => (
          <div
            key={item.label}
            className={`panel border-l-4 rounded-r-xl p-5 ${item.accent}`}
          >
            <p className="text-sm font-medium text-slate-600">{item.label}</p>
            <p
              className={`mt-2 text-3xl font-extrabold tracking-tight ${item.valueClass}`}
            >
              {item.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{item.hint}</p>
          </div>
        ))}
      </div>

      {error ? (
        <div className="alert-error mb-5" role="alert">
          {error}
        </div>
      ) : null}

      <section className="panel overflow-hidden rounded-xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="panel-title">Daftar kegiatan</h2>
          <p className="mt-1 text-sm text-slate-600">
            Edit pertanyaan, buka tautan peserta, atau tutup absensi ketika
            kegiatan selesai.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3 px-5 py-8" aria-busy="true">
            <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
            <p className="text-sm text-slate-500">Memuat kegiatan...</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-base font-bold text-ink">Belum ada kegiatan</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
              Klik &quot;Buat kegiatan baru&quot; untuk membuat form absensi,
              lalu bagikan QR Code kepada peserta.
            </p>
            <button
              type="button"
              onClick={() => {
                void handleCreate();
              }}
              disabled={busyId === "new"}
              className="btn btn-primary mt-5"
            >
              Buat kegiatan baru
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {forms.map((form) => {
              const count = counts[form.id] ?? 0;
              const state = getFormOpenState(form, count);
              const open = state === "open";
              return (
                <li
                  key={form.id}
                  className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-bold text-ink">
                        {form.title}
                      </p>
                      <span
                        className={`status-pill ${
                          open
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {open
                          ? "Dibuka"
                          : getOpenStateMessage(state) || "Ditutup"}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
                      <span>{formatEventDate(form.eventDate)}</span>
                      <span className="font-semibold text-slate-800">
                        {count} peserta
                      </span>
                      <span>
                        {form.closesAt
                          ? `Batas waktu: ${new Date(form.closesAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`
                          : "Tanpa batas waktu otomatis"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/form/${encodeURIComponent(form.id)}/edit`}
                      className="btn btn-secondary btn-sm"
                    >
                      Edit form
                    </Link>
                    <Link
                      href={`/admin/form/${encodeURIComponent(form.id)}/rekap`}
                      className="btn btn-secondary btn-sm"
                    >
                      Peserta ({count})
                    </Link>
                    <Link
                      href={`/absen/${encodeURIComponent(form.token)}?preview=1`}
                      target="_blank"
                      className="btn btn-secondary btn-sm"
                    >
                      Pratinjau
                    </Link>
                    <button
                      type="button"
                      disabled={busyId === form.id}
                      onClick={() => {
                        void toggleStatus(form);
                      }}
                      className={`btn btn-sm ${
                        open ? "btn-gold" : "btn-primary"
                      }`}
                    >
                      {busyId === form.id
                        ? "Memproses..."
                        : open
                          ? "Tutup absensi"
                          : "Buka absensi"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === form.id}
                      onClick={() => {
                        void handleDelete(form);
                      }}
                      className="btn btn-danger btn-sm"
                    >
                      Hapus
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
