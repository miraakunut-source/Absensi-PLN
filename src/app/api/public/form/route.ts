import { countResponses, getConfig, getConfigByToken } from "@/lib/formStorage";
import { getFormOpenState } from "@/lib/formStatus";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const token = (url.searchParams.get("token") ?? "").trim();
  const formId = (url.searchParams.get("id") ?? "").trim();

  if (!token && !formId) {
    return Response.json(
      { error: "Token atau id form wajib diisi" },
      { status: 400 },
    );
  }

  try {
    const byToken = token ? await getConfigByToken(token) : null;
    const config = byToken ?? (formId ? await getConfig(formId) : null);

    if (!config) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }

    const count = await countResponses(config.id);
    return Response.json(
      { config, count, openState: getFormOpenState(config, count) },
      {
        headers: {
          "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal memuat formulir absensi.",
      },
      { status: 500 },
    );
  }
}
