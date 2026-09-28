const DRIVE_SOURCES = [
  (id: string) => `https://drive.google.com/uc?export=view&id=${id}`,
  (id: string) => `https://lh3.googleusercontent.com/d/${id}=w1000`,
];

function extractFileId(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^[A-Za-z0-9_-]{10,}$/.test(trimmed)) return trimmed;
  const match =
    trimmed.match(/[?&]id=([^&]+)/) ?? trimmed.match(/\/d\/([^/?]+)/);
  return match?.[1] ?? null;
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const fileId = extractFileId(url.searchParams.get("id") ?? url.searchParams.get("url"));

  if (!fileId) {
    return Response.json({ error: "id file tidak valid" }, { status: 400 });
  }

  for (const build of DRIVE_SOURCES) {
    try {
      const upstream = await fetch(build(fileId), {
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
      });
      const contentType = upstream.headers.get("content-type") ?? "";
      if (!upstream.ok || !contentType.startsWith("image/")) {
        continue;
      }
      return new Response(upstream.body, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
        },
      });
    } catch {
      continue;
    }
  }

  return Response.json(
    { error: "Gambar tanda tangan tidak dapat dimuat" },
    { status: 404 },
  );
}
