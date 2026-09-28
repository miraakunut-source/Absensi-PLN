import type { ReactNode } from "react";
import AppFooter from "@/components/brand/AppFooter";
import BrandBar from "@/components/brand/BrandBar";

interface PublicShellProps {
  children: ReactNode;
  headerAction?: ReactNode;
}

export default function PublicShell({ children, headerAction }: PublicShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <BrandBar trailing={headerAction} />
      <main className="flex-1">{children}</main>
      <AppFooter />
    </div>
  );
}
