import type { ReactNode } from "react";
import BarLink from "@/components/brand/BarLink";
import BrandBar from "@/components/brand/BrandBar";

interface PublicShellProps {
  children: ReactNode;
  footer?: ReactNode;
}

export default function PublicShell({ children, footer }: PublicShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <BrandBar trailing={<BarLink href="/admin/login">Login Admin</BarLink>} />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto max-w-2xl px-4 py-5">
          {footer ?? (
            <p className="type-caption">
              PT PLN (Persero) UP3 Kediri. Bila tautan tidak dapat dibuka, minta
              QR Code resmi kepada panitia kegiatan.
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
