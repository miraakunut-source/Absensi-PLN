import { type ReactNode } from "react";
import PlnMark from "@/components/brand/PlnMark";

interface PublicShellProps {
  children: ReactNode;
  footer?: ReactNode;
}

export default function PublicShell({ children, footer }: PublicShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b-4 border-gold-500 bg-brand-800">
        <div className="mx-auto w-full max-w-2xl px-4 py-4">
          <PlnMark inverted />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-4 text-xs leading-relaxed text-slate-500">
          {footer ??
            "PT PLN (Persero) UP3 Kediri. Jika tautan tidak dapat dihubungi, minta QR Code resmi kepada panitia kegiatan."}
        </div>
      </footer>
    </div>
  );
}
