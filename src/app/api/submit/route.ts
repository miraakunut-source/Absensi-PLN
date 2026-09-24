import { uploadSignature } from "@/lib/gasService";
import { getFormOpenState } from "@/lib/formStatus";
import { getConfig, countResponses } from "@/lib/formStorage";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

const MAX_SIGNATURE_LENGTH = 500_000;

interface SubmitBody {
  formId?: unknown;
  answers?: unknown;
  signatureDataUrl?: unknown;
  respondentName?: unknown;
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
  const answers =
    body.answers &&
    typeof body.answers === "object" &&
    !Array.isArray(body.answers)
      ? (body.answers as Record<string, string | string[]>)
      : null;
  const signatureDataUrl =
    typeof body.signatureDataUrl === "string" ? body.signatureDataUrl : "";
  const respondentName =
    typeof body.respondentName === "string" ? body.respondentName.trim() : "";

  if (!formId) {
    return Response.json({ error: "formId wajib diisi" }, { status: 400 });
  }

  if (!answers) {
    return Response.json(
      { error: "Jawaban form tidak valid" },
      { status: 400 },
    );
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

  if (!isSupabaseConfigured || !supabase) {
    return Response.json(
      { error: "Supabase belum dikonfigurasi di server" },
      { status: 503 },
    );
  }

  let config;
  try {
    config = await getConfig(formId);
  } catch {
    config = null;
  }

  if (!config) {
    return Response.json(
      { error: "Form tidak ditemukan" },
      { status: 404 },
    );
  }

  try {
    const count = await countResponses(formId);
    const state = getFormOpenState(config, count);
    if (state !== "open") {
      const messages: Record<string, string> = {
        closed_manual: "Form sudah ditutup oleh admin",
        not_started: "Form belum dibuka",
        deadline_passed: "Batas waktu pengisian sudah berakhir",
        max_reached: "Kuota peserta sudah penuh",
      };
      return Response.json(
        { error: messages[state] ?? "Form tidak menerima absensi" },
        { status: 403 },
      );
    }
  } catch {
    return Response.json(
      { error: "Gagal memvalidasi status form" },
      { status: 500 },
    );
  }

  let signatureUrl: string | null = null;

  try {
    const upload = await uploadSignature({
      formId,
      respondentName,
      signatureDataUrl,
    });
    signatureUrl = upload.url;
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

  const { data, error } = await supabase
    .from("form_responses")
    .insert({
      form_id: formId,
      answers,
      respondent_name: respondentName || null,
      signature_url: signatureUrl,
      signature_data_url: signatureDataUrl,
    })
    .select("id")
    .single();

  if (error || !data) {
    return Response.json(
      {
        error: error?.message || "Gagal menyimpan absensi ke database",
      },
      { status: 500 },
    );
  }

  return Response.json({
    id: data.id,
    signatureUrl,
  });
}
