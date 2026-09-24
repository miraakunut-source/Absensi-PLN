export interface UploadSignatureInput {
  formId: string;
  respondentName?: string;
  signatureDataUrl: string;
}

export interface UploadSignatureResult {
  url: string | null;
}

function getGasUrl(): string | null {
  return (
    process.env.GAS_WEB_APP_URL ||
    process.env.NEXT_PUBLIC_GAS_URL ||
    null
  );
}

function splitDataUrl(dataUrl: string): {
  base64: string;
  mimeType: string;
} {
  const commaIndex = dataUrl.indexOf(",");
  if (!dataUrl.startsWith("data:image") || commaIndex < 0) {
    throw new Error("Format tanda tangan tidak valid");
  }
  const mimeType = dataUrl.slice(5, dataUrl.indexOf(";") > 0 ? dataUrl.indexOf(";") : commaIndex);
  return {
    base64: dataUrl.slice(commaIndex + 1),
    mimeType,
  };
}

function normalizeDriveUrl(url: string): string {
  if (!url.includes("drive.google.com")) return url;
  const idMatch =
    url.match(/[?&]id=([^&]+)/) ?? url.match(/\/d\/([^/?]+)/);
  const fileId = idMatch?.[1];
  if (!fileId) return url;
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

export async function uploadSignature(
  input: UploadSignatureInput,
): Promise<UploadSignatureResult> {
  const gasUrl = getGasUrl();

  if (!gasUrl) {
    return { url: null };
  }

  const { base64, mimeType } = splitDataUrl(input.signatureDataUrl);
  const extension = mimeType.includes("jpeg") ? "jpg" : "png";

  const response = await fetch(gasUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      formId: input.formId,
      respondentName: input.respondentName ?? "",
      signatureDataUrl: input.signatureDataUrl,
      image: base64,
      mimeType,
      fileName: `ttd-${input.formId}-${Date.now()}.${extension}`,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Google Apps Script menolak unggahan (${response.status})`);
  }

  const data: unknown = await response.json();
  const url =
    typeof data === "string"
      ? data
      : ((data as { url?: string; result?: string; link?: string })?.url ??
        (data as { result?: string })?.result ??
        (data as { link?: string })?.link ??
        null);

  if (!url) {
    throw new Error("Google Apps Script tidak mengembalikan URL tanda tangan");
  }

  return { url: normalizeDriveUrl(url) };
}
