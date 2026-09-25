"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card, { CardHeader } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { countResponses, deleteForm, listForms } from "@/lib/formStorage";
import { getFormOpenState, getOpenStateMessage } from "@/lib/formStatus";
import { generateId } from "@/lib/ids";
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

function formatDeadline(value: string): string {
  try {
    return new Date(value).toLocaleString("id-ID", {
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
  const [wallUrl, setWallUrl] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const list = await listForms();
        setWallUrl(`${window.location.origin}/absen`);
        const entries = await Promise.all(
          list.map(async (form) => {
            try {
              const count = await countResponses(form.id);
              return [form.id, count] as const;
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
      router.push(
        `/admin/form/${encodeURIComponent(generateId("kegiatan"))}/edit?draft=1`,
      );
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Kegiatan gagal dibuat. Coba lagi.",
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
      accent: "border-l-line-strong",
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
      <div className="print:hidden">
        <PageHeader
          title="Dashboard absensi"
          description="Ringkasan kegiatan, jumlah peserta, serta kontrol buka dan tutup absensi peserta. Formulir baru hanya tersimpan setelah Anda menekan Simpan formulir di editor."
          actions={
            <Button
              size="lg"
              onClick={() => {
                void handleCreate();
              }}
              disabled={busyId === "new"}
            >
              {busyId === "new" ? "Membuat kegiatan..." : "Buat kegiatan baru"}
            </Button>
          }
        />
      </div>

      <div className="mb-6 grid gap-3 print:hidden sm:grid-cols-3">
        {statItems.map((item) => (
          <Card
            key={item.label}
            className={`border-l-4 ${item.accent} px-5 py-4`}
          >
            <p className="type-caption">{item.label}</p>
            <p
              className={`mt-1 text-3xl font-extrabold tracking-tight ${item.valueClass}`}
            >
              {item.value}
            </p>
            <p className="type-caption mt-1">{item.hint}</p>
          </Card>
        ))}
      </div>

      {error ? (
        <Alert tone="danger" className="mb-5 print:hidden">
          {error}
        </Alert>
      ) : null}

      <div className="print:hidden">
        <Card tone="transparent" className="border border-line">
        <CardHeader
          title="Daftar kegiatan"
          description="Edit pertanyaan, buka tautan peserta, atau tutup absensi saat kegiatan selesai."
        />

        {loading ? (
          <div className="space-y-3 px-5 py-6" aria-busy="true">
            <div className="h-16 animate-pulse rounded-md bg-sunken" />
            <div className="h-16 animate-pulse rounded-md bg-sunken" />
            <div className="h-16 animate-pulse rounded-md bg-sunken" />
            <p className="type-caption">Memuat kegiatan...</p>
          </div>
        ) : forms.length === 0 ? (
          <EmptyState
            compact
            title="Belum ada kegiatan"
            description="Buat kegiatan baru untuk menyiapkan form absensi, lalu bagikan QR Code kepada peserta."
            action={
              <Button
                onClick={() => {
                  void handleCreate();
                }}
                disabled={busyId === "new"}
              >
                Buat kegiatan baru
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {forms.map((form) => {
              const count = counts[form.id] ?? 0;
              const state = getFormOpenState(form, count);
              const open = state === "open";
              const busy = busyId === form.id;
              return (
                <li
                  key={form.id}
                  className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-start lg:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="type-heading min-w-0 break-words">
                        {form.title}
                      </p>
                      <Badge tone={open ? "success" : "neutral"}>
                        {open ? "Dibuka" : getOpenStateMessage(state) || "Ditutup"}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                      <span className="type-caption">
                        {formatEventDate(form.eventDate)}
                      </span>
                      <span className="type-caption font-semibold text-ink">
                        {count} peserta
                      </span>
                      <span className="type-caption">
                        {form.closesAt
                          ? `Batas waktu ${formatDeadline(form.closesAt)}`
                          : "Tanpa batas waktu otomatis"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      href={`/admin/form/${encodeURIComponent(form.id)}/edit`}
                      variant="secondary"
                      size="sm"
                    >
                      Edit form
                    </Button>
                    <Button
                      href={`/admin/form/${encodeURIComponent(form.id)}/rekap`}
                      variant="secondary"
                      size="sm"
                    >
                      Rekap ({count})
                    </Button>
                    <Link
                      href={`/absen/${encodeURIComponent(form.token)}?preview=1`}
                      target="_blank"
                      className="inline-flex min-h-9 items-center rounded-lg border border-line-strong bg-surface px-3 text-xs font-semibold text-ink transition-colors hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                    >
                      Pratinjau
                    </Link>
                    <Button
                      variant={open ? "accent" : "primary"}
                      size="sm"
                      disabled={busy}
                      onClick={() => {
                        void toggleStatus(form);
                      }}
                    >
                      {busy
                        ? "Memproses..."
                        : open
                          ? "Tutup absensi"
                          : "Buka absensi"}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={busy}
                      onClick={() => {
                        void handleDelete(form);
                      }}
                    >
                      Hapus
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        </Card>
      </div>

      <Card className="print-area mt-6 p-5 sm:p-6">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <div className="shrink-0 rounded-md border border-line bg-surface p-3">
            <QRCodeCanvas value={wallUrl} size={168} level="M" marginSize={2} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="type-title">QR Code tembok</h2>
            <p className="type-body mt-2 text-muted">
              Satu QR untuk semua kegiatan. Cetak sekali lalu tempel di tembok
              atau meja depan. Peserta memindai QR ini dan memilih kegiatan yang
              sedang dibuka, jadi QR tidak perlu diganti setiap kegiatan.
            </p>
            <p className="type-caption mt-3 break-all rounded-md bg-sunken p-3 font-mono text-brand-800">
              {wallUrl}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Button variant="accent" onClick={() => window.print()}>
                Cetak QR tembok
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = wallUrl;
                  link.target = "_blank";
                  link.rel = "noopener";
                  link.click();
                }}
              >
                Buka halaman QR
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
