"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Alert from "@/components/ui/Alert";
import { isFirebaseConfigured, watchAdmin } from "@/lib/firebase";

interface AuthGuardProps {
  children: ReactNode;
}

function GuardMessage({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-2xl items-center justify-center px-4 py-16">
      <p className="type-body text-muted">{children}</p>
    </div>
  );
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<"loading" | "authed" | "guest" | "dev">(
    () => (isFirebaseConfigured ? "loading" : "dev"),
  );

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }

    return watchAdmin((user) => {
      if (user) {
        setStatus("authed");
      } else {
        setStatus("guest");
        const next = encodeURIComponent(pathname);
        router.replace(`/admin/login?next=${next}`);
      }
    });
  }, [router, pathname]);

  if (status === "loading") {
    return <GuardMessage>Memeriksa sesi admin...</GuardMessage>;
  }

  if (status === "guest") {
    return <GuardMessage>Mengalihkan ke halaman login...</GuardMessage>;
  }

  return (
    <>
      {status === "dev" ? (
        <div className="px-4 pt-4">
          <div className="mx-auto max-w-6xl">
            <Alert tone="warn" title="Mode pengembangan">
              Firebase Auth belum dikonfigurasi sehingga halaman admin terbuka
              tanpa login. Isi <code>NEXT_PUBLIC_FIREBASE_*</code> di{" "}
              <code>.env.local</code> sebelum dipakai di produksi.
            </Alert>
          </div>
        </div>
      ) : null}
      {children}
    </>
  );
}
