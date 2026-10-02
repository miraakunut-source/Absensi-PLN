import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/adminSession";
import { getAppSettingsState, testGasConnection } from "@/lib/appSettings";
import type { AppSettings } from "@/types";

async function requireAdmin(): Promise<{ email: string } | null> {
  const store = await cookies();
  const session = verifyAdminSession(store.get(ADMIN_SESSION_COOKIE)?.value);
  return session ? { email: session.email } : null;
}

function readSettingsBody(value: unknown): AppSettings | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  const field = (key: string): string =>
    typeof raw[key] === "string" ? (raw[key] as string) : "";

  return {
    gasWebAppUrl: field("gasWebAppUrl"),
    driveFolderId: field("driveFolderId"),
    firebaseApiKey: field("firebaseApiKey"),
    firebaseAuthDomain: field("firebaseAuthDomain"),
    firebaseProjectId: field("firebaseProjectId"),
    firebaseStorageBucket: field("firebaseStorageBucket"),
  };
}

export async function GET(): Promise<Response> {
  const admin = await requireAdmin();
  if (!admin) {
    return Response.json(
      { error: "Sesi admin tidak valid. Silakan login ulang." },
      { status: 401 },
    );
  }

  try {
    const state = await getAppSettingsState({ fresh: true });
    return Response.json({ ...state });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Gagal memuat pengaturan.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  const admin = await requireAdmin();
  if (!admin) {
    return Response.json(
      { error: "Sesi admin tidak valid. Silakan login ulang." },
      { status: 401 },
    );
  }

  let body: { action?: unknown; settings?: unknown } = {};
  try {
    body = (await request.json()) as { action?: unknown; settings?: unknown };
  } catch {
    body = {};
  }

  const action = typeof body.action === "string" ? body.action : "test";

  if (action !== "test") {
    return Response.json(
      { error: "Aksi tidak dikenal. Gunakan action: test." },
      { status: 400 },
    );
  }

  const submitted = readSettingsBody(body.settings);
  const stored = await getAppSettingsState();
  const url = submitted?.gasWebAppUrl.trim() || stored.settings.gasWebAppUrl;
  const result = await testGasConnection(url);
  return Response.json({ test: result });
}
