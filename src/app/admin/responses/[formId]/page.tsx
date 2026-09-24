import { redirect } from "next/navigation";

export default async function LegacyResponsesPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  redirect(`/admin/form/${encodeURIComponent(formId)}/rekap`);
}
