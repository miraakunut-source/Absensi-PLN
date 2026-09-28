import type { ReactNode } from "react";
import AppFooter from "@/components/brand/AppFooter";
import BrandBar from "@/components/brand/BrandBar";

interface PublicShellProps {
  children: ReactNode;
}

export default function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <BrandBar />
      <main className="flex-1">{children}</main>
      <AppFooter />
    </div>
  );
}
