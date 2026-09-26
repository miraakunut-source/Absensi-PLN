"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import BrandBar from "@/components/brand/BrandBar";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Field, { CONTROL_CLASS } from "@/components/ui/Field";
import PasswordInput from "@/components/ui/PasswordInput";
import {
  isFirebaseConfigured,
  loginAdmin,
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
    <div className="flex min-h-dvh flex-col bg-canvas">
      <BrandBar />

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center">
            <h1 className="type-display">Login Admin</h1>
            <p className="type-body mt-2 text-muted">
              Gunakan akun admin yang terdaftar di Firebase Authentication.
              Peserta tidak perlu login untuk mengisi absensi.
            </p>
          </div>

          <Card className="mt-6 p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Field label="Email" htmlFor="email">
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  suppressHydrationWarning
                  className={CONTROL_CLASS}
                  placeholder="admin@plnup3kediri.id"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>

              <Field label="Password" htmlFor="password">
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Field>

              {error ? <Alert tone="danger">{error}</Alert> : null}

              <Button
                type="submit"
                size="lg"
                fullWidth
                suppressHydrationWarning
                disabled={loading}
              >
                {loading ? "Memproses..." : "Masuk ke dashboard"}
              </Button>
            </form>
          </Card>

          <div className="mt-5 text-center">
            <Link
              href="/"
              className="text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Kembali ke beranda
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
