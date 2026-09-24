import { redirect } from "next/navigation";

export default async function LegacyFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ formId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ formId }, sp] = await Promise.all([params, searchParams]);
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
    } else {
      query.append(key, value);
    }
  }
  const suffix = query.toString();
  redirect(`/absen/${encodeURIComponent(formId)}${suffix ? `?${suffix}` : ""}`);
}
