import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { createBlankForm, defaultFormConfig } from "@/lib/defaultForm";
import { generateId } from "@/lib/ids";
import { getFormOpenState } from "@/lib/formStatus";
import { db } from "@/lib/firebase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FormConfig, FormOpenState, FormResponse } from "@/types";

function isSupabaseEnvConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

async function getSupabase(): Promise<SupabaseClient | null> {
  if (!isSupabaseEnvConfigured()) return null;
  const { supabase } = await import("@/lib/supabaseClient");
  return supabase;
}

export interface SubmitPayload {
  formId: string;
  answers: Record<string, string | string[]>;
  signatureDataUrl: string;
  respondentName?: string;
}

export interface SubmitResult {
  id: string;
  signatureUrl?: string | null;
  signatureDataUrl?: string | null;
  createdAt?: string;
}

function configKey(formId: string): string {
  return `absensi-form:${formId}`;
}

function responsesKey(formId: string): string {
  return `absensi-responses:${formId}`;
}

const FORM_INDEX_KEY = "absensi-form-index";

function readLocalIndex(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FORM_INDEX_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalIndex(ids: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FORM_INDEX_KEY, JSON.stringify(ids));
}

function addToLocalIndex(formId: string): void {
  const ids = readLocalIndex();
  if (!ids.includes(formId)) {
    writeLocalIndex([formId, ...ids]);
  }
}

function removeFromLocalIndex(formId: string): void {
  writeLocalIndex(readLocalIndex().filter((id) => id !== formId));
}

function readLocalConfig(formId: string): FormConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(configKey(formId));
    if (!raw) return null;
    return JSON.parse(raw) as FormConfig;
  } catch {
    return null;
  }
}

function writeLocalConfig(config: FormConfig): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(configKey(config.id), JSON.stringify(config));
  addToLocalIndex(config.id);
}

function readLocalResponses(formId: string): FormResponse[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(responsesKey(formId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FormResponse[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalResponses(formId: string, rows: FormResponse[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(responsesKey(formId), JSON.stringify(rows));
}

function mapSupabaseConfig(row: {
  config?: unknown;
  id?: unknown;
  token?: unknown;
  title?: unknown;
  description?: unknown;
  status?: unknown;
  event_date?: unknown;
  closes_at?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
}): FormConfig | null {
  const base = (row.config ?? null) as FormConfig | null;
  if (!base) return null;
  return {
    ...base,
    id: String(row.id ?? base.id),
    token: String(row.token ?? base.token ?? ""),
    title: String(row.title ?? base.title ?? ""),
    description: (row.description ?? base.description ?? "") as string,
    status: ((row.status ?? base.status ?? "open") as FormConfig["status"]),
    eventDate: (row.event_date ?? base.eventDate ?? undefined) as
      | string
      | undefined,
    closesAt: (row.closes_at ?? base.closesAt ?? null) as string | null,
    createdAt: (row.created_at ?? base.createdAt) as string | undefined,
    updatedAt: (row.updated_at ?? base.updatedAt) as string | undefined,
  };
}

function mapFirestoreConfig(
  id: string,
  data: Record<string, unknown>,
): FormConfig | null {
  const base = (data.config ?? null) as FormConfig | null;
  if (!base || typeof base !== "object") return null;
  return {
    ...base,
    id,
    token: String(data.token ?? base.token ?? ""),
    title: String(data.title ?? base.title ?? ""),
    description: (data.description ?? base.description ?? "") as string,
    status: ((data.status ?? base.status ?? "open") as FormConfig["status"]),
    eventDate: (data.eventDate ?? base.eventDate ?? undefined) as
      | string
      | undefined,
    closesAt: (data.closesAt ?? base.closesAt ?? null) as string | null,
    createdAt: (data.createdAt ?? base.createdAt) as string | undefined,
    updatedAt: (data.updatedAt ?? base.updatedAt) as string | undefined,
  };
}

function mapFirestoreResponse(
  id: string,
  data: Record<string, unknown>,
): FormResponse {
  return {
    id,
    formId: String(data.formId ?? ""),
    answers: (data.answers ?? {}) as Record<string, string | string[]>,
    respondentName: (data.respondentName ?? null) as string | null,
    signatureUrl: (data.signatureUrl ?? null) as string | null,
    signatureDataUrl: (data.signatureDataUrl ?? null) as string | null,
    createdAt: String(data.createdAt ?? ""),
  };
}

function firestoreConfigPayload(
  config: FormConfig,
  timestamp: string,
): Record<string, unknown> {
  return {
    id: config.id,
    token: config.token,
    title: config.title,
    description: config.description ?? null,
    status: config.status,
    eventDate: config.eventDate ?? null,
    closesAt: config.closesAt ?? null,
    createdAt: config.createdAt ?? timestamp,
    updatedAt: config.updatedAt ?? timestamp,
    config: JSON.parse(JSON.stringify(config)) as FormConfig,
  };
}

async function migrateLocalForms(forms: FormConfig[]): Promise<void> {
  const firestore = db;
  if (!firestore || forms.length === 0) return;
  const results = await Promise.allSettled(
    forms.map((form) =>
      setDoc(
        doc(firestore, "forms", form.id),
        firestoreConfigPayload(form, form.updatedAt ?? new Date().toISOString()),
        { merge: true },
      ),
    ),
  );
  const failed = results.filter((item) => item.status === "rejected");
  if (failed.length > 0) {
    console.warn(
      `Gagal memindahkan ${failed.length} kegiatan lokal ke Firestore`,
      failed[0],
    );
  }
}

export async function getConfig(formId: string): Promise<FormConfig | null> {
  if (db) {
    const snapshot = await getDoc(doc(db, "forms", formId));
    if (snapshot.exists()) {
      const mapped = mapFirestoreConfig(snapshot.id, snapshot.data());
      if (mapped) return mapped;
    }
  }

  const supabase = await getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("forms")
      .select("*")
      .eq("id", formId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    const mapped = data ? mapSupabaseConfig(data) : null;
    if (mapped) return mapped;
  }

  const local = readLocalConfig(formId);
  if (local) return local;

  if (formId === defaultFormConfig.id) {
    return defaultFormConfig;
  }

  return null;
}

export async function getConfigByToken(
  token: string,
): Promise<FormConfig | null> {
  if (!token) return null;

  if (db) {
    const snapshot = await getDocs(
      query(collection(db, "forms"), where("token", "==", token), limit(1)),
    );
    const first = snapshot.docs[0];
    if (first) {
      const mapped = mapFirestoreConfig(first.id, first.data());
      if (mapped) return mapped;
    }
  }

  const supabase = await getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("forms")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    const mapped = data ? mapSupabaseConfig(data) : null;
    if (mapped) return mapped;
  }

  const ids = readLocalIndex();
  for (const id of ids) {
    const config = readLocalConfig(id);
    if (config?.token === token) return config;
  }

  if (defaultFormConfig.token === token) {
    return defaultFormConfig;
  }

  return null;
}

export async function listForms(): Promise<FormConfig[]> {
  if (db) {
    const snapshot = await getDocs(
      query(collection(db, "forms"), orderBy("createdAt", "desc")),
    );
    const remote = snapshot.docs
      .map((item) => mapFirestoreConfig(item.id, item.data()))
      .filter((item): item is FormConfig => Boolean(item));
    const remoteIds = new Set(remote.map((item) => item.id));
    const localOnly: FormConfig[] = [];
    for (const id of readLocalIndex()) {
      const local = readLocalConfig(id);
      if (local && !remoteIds.has(local.id)) {
        localOnly.push(local);
      }
    }
    await migrateLocalForms(localOnly);
    const merged = [...remote, ...localOnly];
    return merged.length > 0 ? merged : [defaultFormConfig];
  }

  const supabase = await getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("forms")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const mapped = (data ?? [])
      .map(mapSupabaseConfig)
      .filter((item): item is FormConfig => Boolean(item));

    if (mapped.length > 0) {
      return mapped;
    }
  }

  const ids = readLocalIndex();
  const local: FormConfig[] = [];
  for (const id of ids) {
    const config = readLocalConfig(id);
    if (config) local.push(config);
  }

  if (local.length === 0) {
    return [defaultFormConfig];
  }

  return local;
}

export async function saveConfig(config: FormConfig): Promise<void> {
  const now = new Date().toISOString();
  const next: FormConfig = { ...config, updatedAt: now };

  writeLocalConfig(next);

  if (db) {
    const payload = firestoreConfigPayload(next, now);
    await setDoc(doc(db, "forms", next.id), payload, { merge: true });
    return;
  }

  const supabase = await getSupabase();
  if (supabase) {
    const { error } = await supabase.from("forms").upsert({
      id: next.id,
      token: next.token,
      title: next.title,
      description: next.description ?? null,
      status: next.status,
      event_date: next.eventDate ?? null,
      closes_at: next.closesAt ?? null,
      config: next,
      created_at: next.createdAt ?? now,
      updated_at: now,
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function createForm(
  overrides: Partial<FormConfig> = {},
): Promise<FormConfig> {
  const config = createBlankForm({
    id: overrides.id ?? generateId("kegiatan"),
    ...overrides,
  });
  await saveConfig(config);
  return config;
}

export async function deleteForm(formId: string): Promise<void> {
  removeFromLocalIndex(formId);
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(configKey(formId));
    window.localStorage.removeItem(responsesKey(formId));
  }

  if (db) {
    const snapshot = await getDocs(
      query(collection(db, "form_responses"), where("formId", "==", formId)),
    );
    await Promise.all(snapshot.docs.map((item) => deleteDoc(item.ref)));
    await deleteDoc(doc(db, "forms", formId));
    return;
  }

  const supabase = await getSupabase();
  if (supabase) {
    await supabase.from("form_responses").delete().eq("form_id", formId);
    const { error } = await supabase.from("forms").delete().eq("id", formId);
    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function listResponses(
  formId: string,
): Promise<FormResponse[]> {
  if (db) {
    const snapshot = await getDocs(
      query(collection(db, "form_responses"), where("formId", "==", formId)),
    );
    const rows = snapshot.docs.map((item) =>
      mapFirestoreResponse(item.id, item.data()),
    );
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return rows;
  }

  const supabase = await getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("form_responses")
      .select("*")
      .eq("form_id", formId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => ({
      id: String(row.id),
      formId: String(row.form_id),
      answers: (row.answers ?? {}) as Record<string, string | string[]>,
      respondentName: (row.respondent_name ?? null) as string | null,
      signatureUrl: (row.signature_url ?? null) as string | null,
      signatureDataUrl: (row.signature_data_url ?? null) as string | null,
      createdAt: String(row.created_at),
    }));
  }

  return readLocalResponses(formId);
}

export async function countResponses(formId: string): Promise<number> {
  if (db) {
    const aggregate = await getCountFromServer(
      query(collection(db, "form_responses"), where("formId", "==", formId)),
    );
    return aggregate.data().count;
  }

  const supabase = await getSupabase();
  if (supabase) {
    const { count, error } = await supabase
      .from("form_responses")
      .select("id", { count: "exact", head: true })
      .eq("form_id", formId);

    if (error) {
      throw new Error(error.message);
    }

    return count ?? 0;
  }

  return readLocalResponses(formId).length;
}

export async function getFormOpenStateWithCount(
  config: FormConfig,
): Promise<FormOpenState> {
  try {
    const count = await countResponses(config.id);
    return getFormOpenState(config, count);
  } catch {
    return getFormOpenState(config);
  }
}

export interface SubmitOptions {
  signatureEndpoint?: string;
}

export async function submitResponse(
  payload: SubmitPayload,
  options: SubmitOptions = {},
): Promise<SubmitResult> {
  const [config, count] = await Promise.all([
    getConfig(payload.formId),
    countResponses(payload.formId),
  ]);
  if (!config) {
    throw new Error("Form tidak ditemukan");
  }

  const state = getFormOpenState(config, count);
  if (state !== "open") {
    const messages: Record<FormOpenState, string> = {
      open: "",
      closed_manual: "Form sudah ditutup oleh admin.",
      not_started: "Form belum dibuka.",
      deadline_passed: "Batas waktu pengisian sudah berakhir.",
      max_reached: "Kuota peserta sudah penuh.",
    };
    throw new Error(messages[state]);
  }

  if (db) {
    let signatureUrl: string | null = null;
    try {
      const response = await fetch(options.signatureEndpoint ?? "/api/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: payload.formId,
          respondentName: payload.respondentName ?? "",
          signatureDataUrl: payload.signatureDataUrl,
        }),
      });
      if (response.ok) {
        const data = (await response.json()) as { url?: string | null };
        signatureUrl = data.url ?? null;
      } else {
        console.warn("Unggah tanda tangan ke GAS dilewati", response.status);
      }
    } catch {
      signatureUrl = null;
    }

    const now = new Date().toISOString();
    const storedSignature = signatureUrl ? null : payload.signatureDataUrl;
    const created = await addDoc(collection(db, "form_responses"), {
      formId: payload.formId,
      answers: payload.answers,
      respondentName: payload.respondentName ?? null,
      signatureUrl,
      signatureDataUrl: storedSignature,
      createdAt: now,
    });

    return {
      id: created.id,
      signatureUrl,
      signatureDataUrl: storedSignature,
      createdAt: now,
    };
  }

  if (isSupabaseEnvConfigured()) {
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as {
      id?: string;
      signatureUrl?: string | null;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(data.error || "Gagal mengirim absensi");
    }

    return {
      id: data.id ?? "",
      signatureUrl: data.signatureUrl ?? null,
      signatureDataUrl: payload.signatureDataUrl,
    };
  }

  const now = new Date().toISOString();
  const row: FormResponse = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}`,
    formId: payload.formId,
    answers: payload.answers,
    respondentName: payload.respondentName ?? null,
    signatureUrl: null,
    signatureDataUrl: payload.signatureDataUrl,
    createdAt: now,
  };

  const rows = readLocalResponses(payload.formId);
  writeLocalResponses(payload.formId, [row, ...rows]);

  return {
    id: row.id,
    signatureUrl: null,
    signatureDataUrl: row.signatureDataUrl,
    createdAt: row.createdAt,
  };
}
