import { submitResponse } from "@/lib/formStorage";

const MAX_SIGNATURE_LENGTH = 900_000;
const MAX_ANSWER_LENGTH = 5_000;

interface SubmitBody {
  formId?: unknown;
  answers?: unknown;
  respondentName?: unknown;
  signatureDataUrl?: unknown;
}

function isAnswers(value: unknown): value is Record<string, string | string[]> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every((item) => {
    if (typeof item === "string") return item.length <= MAX_ANSWER_LENGTH;
    if (Array.isArray(item)) {
      return item.every(
        (entry) => typeof entry === "string" && entry.length <= MAX_ANSWER_LENGTH,
      );
    }
    return false;
  });
}

export async function POST(request: Request): Promise<Response> {
  let body: SubmitBody;
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    return Response.json(
      { error: "Format permintaan tidak valid" },
      { status: 400 },
    );
  }

  const formId = typeof body.formId === "string" ? body.formId.trim() : "";
  const respondentName =
    typeof body.respondentName === "string"
      ? body.respondentName.trim().slice(0, 200)
      : "";
  const signatureDataUrl =
    typeof body.signatureDataUrl === "string" ? body.signatureDataUrl : "";

  if (!formId) {
    return Response.json({ error: "Form tidak ditemukan" }, { status: 400 });
  }
  if (!/^data:image\/(png|jpeg|jpg)/.test(signatureDataUrl)) {
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
  if (!isAnswers(body.answers)) {
    return Response.json(
      { error: "Jawaban tidak valid" },
      { status: 400 },
    );
  }

  try {
    const result = await submitResponse(
      {
        formId,
        answers: body.answers,
        signatureDataUrl,
        respondentName,
      },
      { signatureEndpoint: `${new URL(request.url).origin}/api/signature` },
    );

    return Response.json(
      { id: result.id, signatureUrl: result.signatureUrl ?? null },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Absensi gagal dikirim. Coba lagi.",
      },
      { status: 400 },
    );
  }
}
