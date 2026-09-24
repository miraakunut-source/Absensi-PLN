import type { Metadata } from "next";
import ResponsesView from "./ResponsesView";

export const metadata: Metadata = {
  title: "Rekap Absensi | UP3 Kediri",
};

interface RekapPageProps {
  params: Promise<{ id: string }>;
}

export default async function RekapPage({ params }: RekapPageProps) {
  const { id } = await params;
  return <ResponsesView formId={id} />;
}
