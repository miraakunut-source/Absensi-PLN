import { redirect } from "next/navigation";

export default async function LegacyBuilderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const id = typeof sp.id === "string" ? sp.id : null;
  redirect(id ? `/admin/form/${encodeURIComponent(id)}/edit` : "/admin/dashboard");
}
