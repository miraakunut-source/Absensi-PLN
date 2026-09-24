"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { isFirebaseConfigured, watchAdmin } from "@/lib/firebase";

interface AuthGuardProps {
  children: ReactNode;
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
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-slate-600">
        Memeriksa sesi admin...
      </div>
    );
  }

  if (status === "guest") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-slate-600">
        Mengalihkan ke halaman login...
      </div>
    );
  }

  return (
    <>
      {status === "dev" ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
          Mode pengembangan: Firebase Auth belum dikonfigurasi, sehingga admin
          terbuka tanpa login. Isi{" "}
          <code className="font-semibold">NEXT_PUBLIC_FIREBASE_*</code> di{" "}
          <code className="font-semibold">.env.local</code> sebelum digunakan di
          produksi.
        </div>
      ) : null}
      {children}
    </>
  );
}
