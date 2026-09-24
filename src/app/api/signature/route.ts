import { uploadSignature } from "@/lib/gasService";

const MAX_SIGNATURE_LENGTH = 500_000;

interface SignatureBody {
  formId?: unknown;
  respondentName?: unknown;
  signatureDataUrl?: unknown;
}

export async function POST(request: Request): Promise<Response> {
  let body: SignatureBody;
  try {
    body = (await request.json()) as SignatureBody;
  } catch {
    return Response.json(
      { error: "Format permintaan tidak valid" },
      { status: 400 },
    );
  }

  const formId = typeof body.formId === "string" ? body.formId.trim() : "";
  const signatureDataUrl =
    typeof body.signatureDataUrl === "string" ? body.signatureDataUrl : "";
  const respondentName =
    typeof body.respondentName === "string" ? body.respondentName.trim() : "";

  if (!formId) {
    return Response.json({ error: "formId wajib diisi" }, { status: 400 });
  }
  if (!signatureDataUrl.startsWith("data:image")) {
    return Response.json(
      { error: "Tanda tangan wajib diisi" },
      { status: 400 },
    );
  }
  if (signatureDataUrl.length > MAX_SIGNATURE_LENGTH) {
    return Response.json(
      { error: "Ukuran tanda tangan terlalu besar" },
      { status: 413 },
    );
  }

  try {
    const result = await uploadSignature({
      formId,
      respondentName,
      signatureDataUrl,
    });
    return Response.json({ url: result.url });
  } catch (uploadError) {
    return Response.json(
      {
        error:
          uploadError instanceof Error
            ? uploadError.message
            : "Gagal mengunggah tanda tangan ke Google Drive",
      },
      { status: 502 },
    );
  }
}
