import type { FormConfig } from "@/types";

const INDEX_KEY = "absensi-draft-index";

function draftKey(id: string): string {
  return `absensi-draft:${id}`;
}

export interface DraftMeta {
  id: string;
  title: string;
  updatedAt: string;
}

function readIndex(): DraftMeta[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(INDEX_KEY);
    const parsed = raw ? (JSON.parse(raw) as DraftMeta[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIndex(items: DraftMeta[]): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(INDEX_KEY, JSON.stringify(items));
  } catch {
    // penyimpanan penuh atau tidak tersedia
  }
}

export function saveDraft(config: FormConfig): void {
  if (typeof window === "undefined") return;
  const updatedAt = new Date().toISOString();
  const draft: FormConfig = { ...config, updatedAt };
  try {
    window.sessionStorage.setItem(draftKey(draft.id), JSON.stringify(draft));
    const index = readIndex().filter((item) => item.id !== draft.id);
    index.unshift({ id: draft.id, title: draft.title, updatedAt });
    writeIndex(index);
  } catch {
    // penyimpanan penuh atau tidak tersedia
  }
}

export function getDraft(id: string): FormConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(draftKey(id));
    return raw ? (JSON.parse(raw) as FormConfig) : null;
  } catch {
    return null;
  }
}

export function listDrafts(): FormConfig[] {
  if (typeof window === "undefined") return [];
  const drafts: FormConfig[] = [];
  for (const meta of readIndex()) {
    const draft = getDraft(meta.id);
    if (draft) drafts.push(draft);
  }
  return drafts;
}

export function deleteDraft(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(draftKey(id));
  } catch {
    // abaikan
  }
  writeIndex(readIndex().filter((item) => item.id !== id));
}
