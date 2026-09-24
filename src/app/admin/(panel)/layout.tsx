import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";
import AuthGuard from "@/components/admin/AuthGuard";

export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  );
}
