import { createHmac, createVerify, timingSafeEqual, X509Certificate } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "absensi_admin_session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const CERTS_CACHE_MS = 6 * 60 * 60 * 1000;

let certsCache: {
  fetchedAt: number;
  byKid: Map<string, X509Certificate>;
} | null = null;

function getSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET || "absensi-pln-dev-admin-session-secret"
  );
}

function sign(payload: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");
}

function encodeEmail(email: string): string {
  return Buffer.from(email, "utf8").toString("base64url");
}

function decodeEmail(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function createAdminSession(email: string): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = `${encodeEmail(email)}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSession(
  value: string | undefined | null,
): { email: string } | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [encodedEmail, expRaw, signature] = parts;
  if (!encodedEmail || !expRaw || !signature) return null;

  const payload = `${encodedEmail}.${expRaw}`;
  const expected = Buffer.from(sign(payload), "utf8");
  const actual = Buffer.from(signature, "utf8");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null;

  const email = decodeEmail(encodedEmail);
  if (!email || !email.includes("@")) return null;
  return { email };
}

function decodeJsonPart(part: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function fetchSigningCert(kid: string): Promise<X509Certificate | null> {
  const now = Date.now();
  const cached = certsCache?.byKid.get(kid);
  if (cached && certsCache && now - certsCache.fetchedAt < CERTS_CACHE_MS) {
    return cached;
  }

  const response = await fetch(CERTS_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`certs_http_${response.status}`);
  }
  const data = (await response.json()) as Record<string, string>;
  const byKid = new Map<string, X509Certificate>();
  for (const [key, pem] of Object.entries(data)) {
    try {
      byKid.set(key, new X509Certificate(pem));
    } catch {
      continue;
    }
  }
  certsCache = { fetchedAt: now, byKid };
  return byKid.get(kid) ?? null;
}

export type IdTokenVerification =
  | { ok: true; email: string; sub: string }
  | { ok: false; reason: string; message: string };

const FAILURE_MESSAGES: Record<string, string> = {
  env_missing:
    "Konfigurasi Firebase belum terbaca server. Restart `npm run dev` setelah mengisi .env.local.",
  format: "Token login tidak valid. Silakan login ulang.",
  header: "Token login tidak valid. Silakan login ulang.",
  iss: "Token login tidak cocok dengan project Firebase ini. Periksa .env.local lalu restart dev server.",
  aud: "Token login tidak cocok dengan project Firebase ini. Periksa NEXT_PUBLIC_FIREBASE_PROJECT_ID di .env.local lalu restart dev server.",
  exp: "Sesi login kedaluwarsa. Silakan login ulang.",
  claims: "Token login tidak lengkap. Silakan login ulang.",
  certs: "Gagal mengambil sertifikat verifikasi dari Google. Periksa koneksi internet server lalu coba lagi.",
  kid: "Sertifikat verifikasi tidak ditemukan. Coba lagi beberapa saat.",
  signature: "Gagal memverifikasi tanda tangan token. Silakan login ulang.",
};

export async function verifyFirebaseIdToken(
  idToken: string,
): Promise<IdTokenVerification> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId) {
    return { ok: false, reason: "env_missing", message: FAILURE_MESSAGES.env_missing };
  }
  if (!idToken) {
    return { ok: false, reason: "format", message: FAILURE_MESSAGES.format };
  }

  const parts = idToken.split(".");
  if (parts.length !== 3) {
    return { ok: false, reason: "format", message: FAILURE_MESSAGES.format };
  }
  const [headerPart, payloadPart, signaturePart] = parts;

  const header = decodeJsonPart(headerPart);
  const payload = decodeJsonPart(payloadPart);
  if (!header || !payload) {
    return { ok: false, reason: "header", message: FAILURE_MESSAGES.header };
  }
  if (header.alg !== "RS256" || typeof header.kid !== "string" || !header.kid) {
    return { ok: false, reason: "header", message: FAILURE_MESSAGES.header };
  }

  const expectedIss = `https://securetoken.google.com/${projectId}`;
  if (payload.iss !== expectedIss) {
    return { ok: false, reason: "iss", message: FAILURE_MESSAGES.iss };
  }
  if (payload.aud !== projectId && payload.aud !== apiKey) {
    return { ok: false, reason: "aud", message: FAILURE_MESSAGES.aud };
  }

  const exp = Number(payload.exp);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) {
    return { ok: false, reason: "exp", message: FAILURE_MESSAGES.exp };
  }

  const email = typeof payload.email === "string" ? payload.email : "";
  const sub = typeof payload.sub === "string" ? payload.sub : "";
  if (!email || !sub) {
    return { ok: false, reason: "claims", message: FAILURE_MESSAGES.claims };
  }

  let cert: X509Certificate | null = null;
  try {
    cert = await fetchSigningCert(header.kid);
  } catch {
    return { ok: false, reason: "certs", message: FAILURE_MESSAGES.certs };
  }
  if (!cert) {
    return { ok: false, reason: "kid", message: FAILURE_MESSAGES.kid };
  }

  try {
    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${headerPart}.${payloadPart}`);
    verifier.end();
    const signature = Buffer.from(signaturePart, "base64url");
    const valid = verifier.verify(cert.publicKey, signature);
    if (!valid) {
      return { ok: false, reason: "signature", message: FAILURE_MESSAGES.signature };
    }
  } catch {
    return { ok: false, reason: "signature", message: FAILURE_MESSAGES.signature };
  }

  return { ok: true, email, sub };
}

export const adminSessionMaxAge = SESSION_MAX_AGE_SECONDS;
