"use client";

import { useCallback, useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import Field, { CONTROL_CLASS } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import {
  EMPTY_SETTINGS,
  saveAppSettings,
} from "@/lib/appSettings";
import { auth } from "@/lib/firebase";
import type { AppSettings, AppSettingsState, GasConnectionResult } from "@/types";

const SOURCE_LABELS: Record<AppSettingsState["source"], string> = {
  firestore: "Firestore settings/config",
  env: "Fallback .env",
  mixed: "Firestore + fallback .env",
};

function formatSavedAt(value: string | null): string {
  if (!value) return "Belum pernah disimpan dari halaman ini";
  try {
    return new Date(value).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    });
  } catch {
    return value;
  }
}

async function fetchSettingsState(): Promise<
  { ok: true; state: AppSettingsState } | { ok: false; message: string }
> {
  try {
    const response = await fetch("/api/admin/settings", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      return {
        ok: false,
        message:
          typeof data.error === "string"
            ? data.error
            : "Gagal memuat pengaturan",
      };
    }

    return { ok: true, state: data as unknown as AppSettingsState };
  } catch {
    return { ok: false, message: "Gagal menghubungi server. Periksa koneksi Anda." };
  }
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(EMPTY_SETTINGS);
  const [source, setSource] = useState<AppSettingsState["source"]>("env");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [updatedBy, setUpdatedBy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "danger" | "info";
    message: string;
  } | null>(null);
  const [connection, setConnection] = useState<GasConnectionResult | null>(null);

  const applyState = useCallback((state: AppSettingsState) => {
    setSettings(state.settings);
    setSource(state.source);
    setUpdatedAt(state.updatedAt);
    setUpdatedBy(state.updatedBy);
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const result = await fetchSettingsState();
    if (result.ok) {
      applyState(result.state);
    } else {
      setLoadError(result.message);
    }
    setLoading(false);
  }, [applyState]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await fetchSettingsState();
      if (cancelled) return;
      if (result.ok) {
        applyState(result.state);
      } else {
        setLoadError(result.message);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [applyState]);

  const update = (key: keyof AppSettings) => (value: string) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setConnection(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const state = await saveAppSettings(
        settings,
        auth?.currentUser?.email ?? null,
      );
      applyState(state);
      setFeedback({
        tone: "success",
        message: `Pengaturan tersimpan di Firestore (settings/config) pada ${formatSavedAt(state.updatedAt)}.`,
      });
    } catch (error) {
      setFeedback({
        tone: "danger",
        message:
          error instanceof Error
            ? error.message
            : "Gagal menyimpan pengaturan. Periksa koneksi Anda.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setFeedback(null);
    setConnection(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", settings }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        test?: GasConnectionResult;
        error?: string;
      };

      if (!response.ok || !data.test) {
        setFeedback({
          tone: "danger",
          message: data.error || "Uji koneksi gagal dijalankan.",
        });
        return;
      }

      setConnection(data.test);
    } catch {
      setFeedback({
        tone: "danger",
        message: "Uji koneksi gagal. Periksa koneksi Anda.",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-8">
      <PageHeader
        title="Pengaturan"
        description="Ubah konfigurasi API dan URL backend untuk kebutuhan migrasi tanpa mengubah file .env atau deploy ulang Vercel. Nilai disimpan di Firestore pada koleksi settings, dokumen config."
      />

      {loadError ? (
        <div className="mb-5">
          <Alert tone="danger" title="Pengaturan tidak terbaca">
            {loadError}{" "}
            <button
              type="button"
              onClick={() => void reload()}
              className="font-semibold underline underline-offset-2"
            >
              Muat ulang
            </button>
          </Alert>
        </div>
      ) : null}

      {feedback ? (
        <div className="mb-5">
          <Alert tone={feedback.tone === "info" ? "info" : feedback.tone}>
            {feedback.message}
          </Alert>
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Badge tone={connection?.ok ? "success" : connection ? "danger" : "neutral"}>
          {connection?.ok ? "🟢 Terhubung" : connection ? "🔴 Gagal Terhubung" : "Belum diuji"}
        </Badge>
        <Badge tone="brand">Sumber: {SOURCE_LABELS[source]}</Badge>
        <span className="type-caption">
          Diperbarui: {formatSavedAt(updatedAt)}
          {updatedBy ? ` oleh ${updatedBy}` : ""}
        </span>
      </div>

      {connection ? (
        <div className="mb-5">
          <Alert
            tone={connection.ok ? "success" : "danger"}
            title={connection.ok ? "Koneksi berhasil" : "Koneksi gagal"}
          >
            {connection.message}
            {connection.status ? ` (HTTP ${connection.status})` : ""}
            {connection.method ? ` · metode ${connection.method}` : ""}
          </Alert>
        </div>
      ) : null}

      <Card>
        <CardHeader
          title="Google Apps Script & Drive"
          description="Dipakai saat presensi dikirim untuk menyimpan tanda tangan ke Google Drive."
        />
        <CardBody className="space-y-5">
          <Field
            label="GAS_WEB_APP_URL"
            htmlFor="gasWebAppUrl"
            hint="URL Web App dari akun PLN, contoh: https://script.google.com/macros/s/AKfy.../exec"
          >
            <input
              id="gasWebAppUrl"
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              className={CONTROL_CLASS}
              placeholder="https://script.google.com/macros/s/.../exec"
              value={settings.gasWebAppUrl}
              onChange={(event) => update("gasWebAppUrl")(event.target.value)}
              disabled={loading}
            />
          </Field>

          <Field
            label="DRIVE_FOLDER_ID"
            htmlFor="driveFolderId"
            hint="ID folder Google Drive penampung rekap, contoh: 1gOG0KUfn7fZGuSkby1gx3_gU5dn3RZYE"
          >
            <input
              id="driveFolderId"
              type="text"
              autoComplete="off"
              spellCheck={false}
              className={CONTROL_CLASS}
              placeholder="1gOG0KUfn7fZGuSkby1gx3_gU5dn3RZYE"
              value={settings.driveFolderId}
              onChange={(event) => update("driveFolderId")(event.target.value)}
              disabled={loading}
            />
          </Field>

          <Alert tone="info" title="Cara cepat testes">
            Tekan “Uji Coba Koneksi” untuk memastikan GAS_WEB_APP_URL merespons
            HTTP 200/OK dari server. Permintaan dikirim ringan; bila script
            menolak GET, aplikasi mencoba POST minimal.
          </Alert>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardHeader
          title="Firebase credentials"
          description="Disimpan untuk kebutuhan migrasi. Nilai aktif tetap mengikuti .env sampai proyek di-deploy ulang."
        />
        <CardBody className="space-y-5">
          <Field
            label="NEXT_PUBLIC_FIREBASE_API_KEY"
            htmlFor="firebaseApiKey"
          >
            <input
              id="firebaseApiKey"
              type="text"
              autoComplete="off"
              spellCheck={false}
              className={CONTROL_CLASS}
              value={settings.firebaseApiKey}
              onChange={(event) => update("firebaseApiKey")(event.target.value)}
              disabled={loading}
            />
          </Field>

          <Field
            label="NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
            htmlFor="firebaseAuthDomain"
          >
            <input
              id="firebaseAuthDomain"
              type="text"
              autoComplete="off"
              spellCheck={false}
              className={CONTROL_CLASS}
              placeholder="project.firebaseapp.com"
              value={settings.firebaseAuthDomain}
              onChange={(event) =>
                update("firebaseAuthDomain")(event.target.value)
              }
              disabled={loading}
            />
          </Field>

          <Field
            label="NEXT_PUBLIC_FIREBASE_PROJECT_ID"
            htmlFor="firebaseProjectId"
          >
            <input
              id="firebaseProjectId"
              type="text"
              autoComplete="off"
              spellCheck={false}
              className={CONTROL_CLASS}
              value={settings.firebaseProjectId}
              onChange={(event) =>
                update("firebaseProjectId")(event.target.value)
              }
              disabled={loading}
            />
          </Field>

          <Field
            label="NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
            htmlFor="firebaseStorageBucket"
          >
            <input
              id="firebaseStorageBucket"
              type="text"
              autoComplete="off"
              spellCheck={false}
              className={CONTROL_CLASS}
              placeholder="project.firebasestorage.app"
              value={settings.firebaseStorageBucket}
              onChange={(event) =>
                update("firebaseStorageBucket")(event.target.value)
              }
              disabled={loading}
            />
          </Field>
        </CardBody>
      </Card>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={handleSave} disabled={saving || loading}>
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
        <Button variant="secondary" onClick={handleTest} disabled={testing || loading}>
          {testing ? "Menguji..." : "Uji Coba Koneksi"}
        </Button>
      </div>

      <p className="type-caption mt-4">
        Jika kolom masih kosong, sistem memakai nilai dari .env sebagai fallback.
        Nilai GAS dan Drive berlaku langsung setelah disimpan; credential
        Firebase memerlukan deploy ulang agar dipakai oleh browser.
      </p>
    </div>
  );
}
