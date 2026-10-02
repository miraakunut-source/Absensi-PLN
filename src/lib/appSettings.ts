import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  AppSettings,
  AppSettingsState,
  GasConnectionResult,
} from "@/types";

export const SETTINGS_COLLECTION = "settings";
export const SETTINGS_DOCUMENT = "config";

const CACHE_TTL_MS = 30_000;
const TEST_TIMEOUT_MS = 12_000;

export const EMPTY_SETTINGS: AppSettings = {
  gasWebAppUrl: "",
  driveFolderId: "",
  firebaseApiKey: "",
  firebaseAuthDomain: "",
  firebaseProjectId: "",
  firebaseStorageBucket: "",
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function pick(primary: string, fallback: string): string {
  return primary.trim() ? primary.trim() : fallback;
}

export function envAppSettings(): AppSettings {
  return {
    gasWebAppUrl: clean(
      process.env.GAS_WEB_APP_URL || process.env.NEXT_PUBLIC_GAS_URL,
    ),
    driveFolderId: clean(process.env.DRIVE_FOLDER_ID),
    firebaseApiKey: clean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
    firebaseAuthDomain: clean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
    firebaseProjectId: clean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    firebaseStorageBucket: clean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  };
}

function mapSettingsDocument(data: Record<string, unknown>): AppSettings {
  return {
    gasWebAppUrl: clean(data.GAS_WEB_APP_URL),
    driveFolderId: clean(data.DRIVE_FOLDER_ID),
    firebaseApiKey: clean(data.NEXT_PUBLIC_FIREBASE_API_KEY),
    firebaseAuthDomain: clean(data.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
    firebaseProjectId: clean(data.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    firebaseStorageBucket: clean(data.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  };
}

function settingsPayload(
  next: AppSettings,
  email: string | null,
): Record<string, unknown> {
  return {
    GAS_WEB_APP_URL: next.gasWebAppUrl,
    DRIVE_FOLDER_ID: next.driveFolderId,
    NEXT_PUBLIC_FIREBASE_API_KEY: next.firebaseApiKey,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: next.firebaseAuthDomain,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: next.firebaseProjectId,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: next.firebaseStorageBucket,
    updatedAt: new Date().toISOString(),
    updatedBy: email ?? "admin",
  };
}

function mergeWithEnv(stored: AppSettings): AppSettings {
  const env = envAppSettings();
  return {
    gasWebAppUrl: pick(stored.gasWebAppUrl, env.gasWebAppUrl),
    driveFolderId: pick(stored.driveFolderId, env.driveFolderId),
    firebaseApiKey: pick(stored.firebaseApiKey, env.firebaseApiKey),
    firebaseAuthDomain: pick(stored.firebaseAuthDomain, env.firebaseAuthDomain),
    firebaseProjectId: pick(stored.firebaseProjectId, env.firebaseProjectId),
    firebaseStorageBucket: pick(
      stored.firebaseStorageBucket,
      env.firebaseStorageBucket,
    ),
  };
}

function detectSource(settings: AppSettings): AppSettingsState["source"] {
  const env = envAppSettings();
  const keys = Object.keys(settings) as (keyof AppSettings)[];
  const filled = keys.filter((key) => settings[key]);
  if (filled.length === 0) return "env";
  const fromEnv = keys.filter((key) => env[key] && env[key] === settings[key]);
  if (fromEnv.length === filled.length) return "env";
  if (fromEnv.length > 0) return "mixed";
  return "firestore";
}

let cache: { at: number; state: AppSettingsState } | null = null;

function invalidateCache(): void {
  cache = null;
}

export async function getAppSettingsState(
  options: { fresh?: boolean } = {},
): Promise<AppSettingsState> {
  if (!options.fresh && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.state;
  }

  const env = envAppSettings();
  let settings = env;
  let updatedAt: string | null = null;
  let updatedBy: string | null = null;

  if (db) {
    try {
      const snapshot = await getDoc(
        doc(db, SETTINGS_COLLECTION, SETTINGS_DOCUMENT),
      );
      if (snapshot.exists()) {
        const data = snapshot.data() as Record<string, unknown>;
        settings = mergeWithEnv(mapSettingsDocument(data));
        updatedAt = clean(data.updatedAt) || null;
        updatedBy = clean(data.updatedBy) || null;
      }
    } catch (error) {
      console.warn("Gagal membaca settings/config dari Firestore", error);
    }
  }

  const state: AppSettingsState = {
    settings,
    source: detectSource(settings),
    updatedAt,
    updatedBy,
  };

  cache = { at: Date.now(), state };
  return state;
}

export async function getGasWebAppUrl(): Promise<string> {
  const { settings } = await getAppSettingsState();
  return settings.gasWebAppUrl;
}

export async function saveAppSettings(
  next: AppSettings,
  email: string | null,
): Promise<AppSettingsState> {
  if (!db) {
    throw new Error(
      "Firestore belum terkonfigurasi. Isi NEXT_PUBLIC_FIREBASE_API_KEY dan NEXT_PUBLIC_FIREBASE_PROJECT_ID di .env.local terlebih dahulu.",
    );
  }

  const normalized: AppSettings = {
    gasWebAppUrl: next.gasWebAppUrl.trim(),
    driveFolderId: next.driveFolderId.trim(),
    firebaseApiKey: next.firebaseApiKey.trim(),
    firebaseAuthDomain: next.firebaseAuthDomain.trim(),
    firebaseProjectId: next.firebaseProjectId.trim(),
    firebaseStorageBucket: next.firebaseStorageBucket.trim(),
  };

  if (normalized.gasWebAppUrl && !/^https:\/\//i.test(normalized.gasWebAppUrl)) {
    throw new Error("GAS_WEB_APP_URL harus diawali https://");
  }

  await setDoc(
    doc(db, SETTINGS_COLLECTION, SETTINGS_DOCUMENT),
    settingsPayload(normalized, email),
    { merge: true },
  );

  invalidateCache();
  return getAppSettingsState({ fresh: true });
}

function describeGetStatus(status: number): string {
  if (status === 401 || status === 403) {
    return "URL menolak akses. Deploy ulang Web App Apps Script dengan akses Anyone.";
  }
  if (status === 404) {
    return "URL tidak ditemukan. Periksa kembali URL /exec Web App Apps Script.";
  }
  if (status >= 500) {
    return `Server Apps Script merespons error (${status}).`;
  }
  return `URL merespons HTTP ${status}.`;
}

export async function testGasConnection(
  rawUrl: string,
): Promise<GasConnectionResult> {
  const url = rawUrl.trim();

  if (!url) {
    return {
      ok: false,
      status: null,
      method: null,
      message: "Isi GAS_WEB_APP_URL terlebih dahulu.",
    };
  }

  if (!/^https:\/\//i.test(url)) {
    return {
      ok: false,
      status: null,
      method: null,
      message: "URL harus diawali https://",
    };
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      headers: { Accept: "*/*" },
      signal: AbortSignal.timeout(TEST_TIMEOUT_MS),
    });

    if (response.status >= 200 && response.status < 400) {
      return {
        ok: true,
        status: response.status,
        method: "GET",
        message: `Terhubung. Apps Script merespons HTTP ${response.status}.`,
      };
    }

    if (response.status >= 300 && response.status < 400) {
      return {
        ok: false,
        status: response.status,
        method: "GET",
        message:
          "URL mengarahkan ke login Google. Deploy ulang Web App dengan akses Anyone.",
      };
    }
  } catch {
    return {
      ok: false,
      status: null,
      method: "GET",
      message: "Tidak bisa menghubungi URL dari server. Periksa URL dan koneksi.",
    };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ping", testConnection: true }),
      cache: "no-store",
      signal: AbortSignal.timeout(TEST_TIMEOUT_MS),
    });

    if (response.ok) {
      return {
        ok: true,
        status: response.status,
        method: "POST",
        message: `Terhubung. Apps Script merespons HTTP ${response.status}.`,
      };
    }

    return {
      ok: false,
      status: response.status,
      method: "POST",
      message: describeGetStatus(response.status),
    };
  } catch {
    return {
      ok: false,
      status: null,
      method: "POST",
      message: "Gagal menghubungi URL dari server. Periksa URL dan koneksi.",
    };
  }
}
