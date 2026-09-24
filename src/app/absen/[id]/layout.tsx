import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Form Absensi | UP3 Kediri",
};

export default function AbsenLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
