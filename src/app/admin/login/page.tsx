"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import PlnMark from "@/components/brand/PlnMark";
import {
  isFirebaseConfigured,
  loginAdmin,
  logoutAdmin,
  watchAdmin,
} from "@/lib/firebase";

function safeNextPath(): string | null {
  const raw = new URLSearchParams(window.location.search).get("next");
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

async function postSession(idToken: string): Promise<void> {
  const response = await fetch("/api/admin/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(data.error || "Gagal membuat sesi admin. Coba lagi.");
  }
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const sessionHandledRef = useRef(false);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    return watchAdmin((user) => {
      if (!user) {
        sessionHandledRef.current = false;
        return;
      }
      if (sessionHandledRef.current) return;
      sessionHandledRef.current = true;

      void (async () => {
        try {
          const idToken = await user.getIdToken();
          await postSession(idToken);
          router.replace(safeNextPath() ?? "/admin/dashboard");
        } catch (sessionError) {
          sessionHandledRef.current = false;
          setError(
            sessionError instanceof Error
              ? sessionError.message
              : "Gagal membuat sesi admin. Coba login ulang.",
          );
          setLoading(false);
        }
      })();
    });
  }, [router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!isFirebaseConfigured) {
      setError(
        "Firebase Auth belum dikonfigurasi. Lengkapi NEXT_PUBLIC_FIREBASE_* di .env.local.",
      );
      return;
    }

    setLoading(true);
    sessionHandledRef.current = true;
    try {
      const user = await loginAdmin(email.trim(), password);
      const idToken = await user.getIdToken();
      await postSession(idToken);
      router.replace(safeNextPath() ?? "/admin/dashboard");
    } catch (loginError) {
      sessionHandledRef.current = false;
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Login gagal. Periksa email dan password lalu coba lagi.",
      );
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-slate-100">
      <header className="border-b-4 border-gold-500 bg-brand-800">
        <div className="mx-auto w-full max-w-md px-4 py-4">
          <PlnMark inverted />
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="panel rounded-xl p-6 sm:p-8">
            <h1 className="page-title text-xl sm:text-2xl">Masuk admin</h1>
            <p className="page-subtitle">
              Dashboard dilindungi Firebase Auth. Gunakan akun email admin yang
              terdaftar. Peserta tidak login di sini — peserta cukup memindai QR
              kegiatan.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="field-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  className="field"
                  placeholder="admin@plnup3kediri.id"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="field-label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  className="field"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              {error ? (
                <div className="alert-error" role="alert">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? "Memproses..." : "Masuk ke dashboard"}
              </button>
            </form>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
            <Link
              href="/"
              className="font-semibold text-brand-700 hover:text-brand-800"
            >
              Kembali ke beranda
            </Link>
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  await logoutAdmin();
                  await fetch("/api/admin/session", { method: "DELETE" });
                })();
              }}
              className="text-slate-500 underline underline-offset-2 hover:text-slate-700"
            >
              Keluar dari sesi aktif (jika ada)
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
