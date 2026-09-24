"use client";

import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import { useCallback, useEffect, use, useState } from "react";
import QRCodeGenerator from "./QRCodeGenerator";
import { getConfig, saveConfig } from "@/lib/formStorage";
import type {
  FormConfig,
  FormPage,
  Question,
  QuestionType,
  QuestionValidation,
} from "@/types";

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "text", label: "Teks singkat" },
  { value: "textarea", label: "Teks panjang" },
  { value: "radio", label: "Pilihan ganda" },
  { value: "checkbox", label: "Checkbox" },
  { value: "select", label: "Dropdown" },
  { value: "date", label: "Tanggal" },
];

const VALIDATION_OPTIONS: { value: QuestionValidation; label: string }[] = [
  { value: "none", label: "Tanpa validasi" },
  { value: "email", label: "Format email" },
  { value: "number", label: "Harus angka" },
];

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const asUtc = Date.parse(`${value}Z`);
  if (Number.isNaN(asUtc)) return null;
  return new Date(asUtc - WIB_OFFSET_MS).toISOString();
}

function needsOptions(type: QuestionType): boolean {
  return type === "select" || type === "radio" || type === "checkbox";
}

function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const wib = new Date(date.getTime() + WIB_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${wib.getUTCFullYear()}-${pad(wib.getUTCMonth() + 1)}-${pad(wib.getUTCDate())}T${pad(wib.getUTCHours())}:${pad(wib.getUTCMinutes())}`;
}

export default function EditFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: formId } = use(params);
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"info" | "error">("info");
  const [formUrl, setFormUrl] = useState("");
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [printQr, setPrintQr] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const existing = await getConfig(formId);
        if (cancelled) return;
        if (!existing) {
          setNotFound(true);
          return;
        }
        setConfig(existing);
        setActivePageId(existing.pages[0]?.id ?? null);
        setFormUrl(`${window.location.origin}/absen/${existing.token}`);
      } catch {
        if (cancelled) return;
        setMessageTone("error");
        setMessage(
          "Form gagal dimuat. Muat ulang halaman atau kembali ke dashboard.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [formId]);

  const updateConfig = useCallback(
    (updater: (current: FormConfig) => FormConfig) => {
      setConfig((current) => (current ? updater(current) : current));
      setMessage(null);
    },
    [],
  );

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setMessage(null);
    try {
      const normalized: FormConfig = {
        ...config,
        questions: config.questions.map((question) =>
          question.options
            ? {
                ...question,
                options: question.options
                  .map((option) => option.trim())
                  .filter(Boolean),
              }
            : question,
        ),
      };
      await saveConfig(normalized);
      setConfig(normalized);
      setMessageTone("info");
      setMessage("Formulir berhasil disimpan.");
    } catch (error) {
      setMessageTone("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Formulir gagal disimpan. Coba lagi.",
      );
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    if (!formUrl) return;
    try {
      await navigator.clipboard.writeText(formUrl);
      setMessageTone("info");
      setMessage("Tautan peserta berhasil disalin ke clipboard.");
    } catch {
      setMessageTone("error");
      setMessage(
        "Tautan gagal disalin. Salin manual dari kolom tautan peserta.",
      );
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-slate-500">
        Memuat editor form...
      </div>
    );
  }

  if (notFound || !config) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-base font-bold text-ink">Form tidak ditemukan</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
          Kegiatan dengan tautan ini tidak ada atau sudah dihapus. Kembali ke
          dashboard untuk memilih kegiatan lain.
        </p>
        <Link href="/admin/dashboard" className="btn btn-primary mt-5 inline-flex">
          Kembali ke dashboard
        </Link>
      </div>
    );
  }

  const activePage =
    config.pages.find((page) => page.id === activePageId) ?? config.pages[0];
  const previewUrl = `${formUrl}?preview=1`;

  const addPage = () => {
    const page: FormPage = {
      id: createId("page"),
      title: `Halaman ${config.pages.length + 1}`,
      questionIds: [],
    };
    updateConfig((current) => ({
      ...current,
      pages: [...current.pages, page],
    }));
    setActivePageId(page.id);
  };

  const updatePage = (pageId: string, patch: Partial<FormPage>) => {
    updateConfig((current) => ({
      ...current,
      pages: current.pages.map((page) =>
        page.id === pageId ? { ...page, ...patch } : page,
      ),
    }));
  };

  const deletePage = (pageId: string) => {
    if (config.pages.length <= 1) {
      setMessageTone("error");
      setMessage("Formulir minimal memiliki satu halaman.");
      return;
    }
    const page = config.pages.find((item) => item.id === pageId);
    updateConfig((current) => {
      const removedIds = new Set(page?.questionIds ?? []);
      return {
        ...current,
        pages: current.pages.filter((item) => item.id !== pageId),
        questions: current.questions.filter(
          (question) => !removedIds.has(question.id),
        ),
      };
    });
    setActivePageId(
      config.pages.find((item) => item.id !== pageId)?.id ?? null,
    );
  };

  const addQuestion = () => {
    if (!activePage) return;
    const question: Question = {
      id: createId("q"),
      type: "text",
      label: "Pertanyaan baru",
      required: false,
      validation: "none",
    };
    updateConfig((current) => ({
      ...current,
      questions: [...current.questions, question],
      pages: current.pages.map((page) =>
        page.id === activePage.id
          ? { ...page, questionIds: [...page.questionIds, question.id] }
          : page,
      ),
    }));
  };

  const updateQuestion = (questionId: string, patch: Partial<Question>) => {
    updateConfig((current) => ({
      ...current,
      questions: current.questions.map((question) => {
        if (question.id !== questionId) return question;
        const next = { ...question, ...patch };
        if (patch.type && needsOptions(patch.type) && !next.options?.length) {
          next.options = ["Opsi 1", "Opsi 2"];
        }
        return next;
      }),
    }));
  };

  const deleteQuestion = (questionId: string) => {
    updateConfig((current) => ({
      ...current,
      questions: current.questions.filter(
        (question) => question.id !== questionId,
      ),
      pages: current.pages.map((page) => ({
        ...page,
        questionIds: page.questionIds.filter((id) => id !== questionId),
      })),
    }));
  };

  const moveQuestion = (questionId: string, direction: -1 | 1) => {
    if (!activePage) return;
    updateConfig((current) => ({
      ...current,
      pages: current.pages.map((page) => {
        if (page.id !== activePage.id) return page;
        const ids = [...page.questionIds];
        const index = ids.indexOf(questionId);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= ids.length) return page;
        [ids[index], ids[target]] = [ids[target], ids[index]];
        return { ...page, questionIds: ids };
      }),
    }));
  };

  const moveQuestionToPage = (questionId: string, targetPageId: string) => {
    if (!activePage || targetPageId === activePage.id) return;
    updateConfig((current) => ({
      ...current,
      pages: current.pages.map((page) => {
        if (page.id === activePage.id) {
          return {
            ...page,
            questionIds: page.questionIds.filter((id) => id !== questionId),
          };
        }
        if (page.id === targetPageId) {
          return { ...page, questionIds: [...page.questionIds, questionId] };
        }
        return page;
      }),
    }));
  };

  const activeQuestions = (activePage?.questionIds ?? [])
    .map((id) => config.questions.find((question) => question.id === id))
    .filter((question): question is Question => Boolean(question));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-700">Editor form</p>
          <h1 className="page-title mt-1">Atur kegiatan absensi</h1>
          <p className="page-subtitle">
            Sesuaikan informasi kegiatan, halaman form, pertanyaan, dan QR Code
            untuk peserta.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/dashboard" className="btn btn-secondary">
            Dashboard
          </Link>
          <button
            type="button"
            onClick={() => window.open(previewUrl, "_blank", "noopener")}
            className="btn btn-secondary"
          >
            Pratinjau form
          </button>
          <button
            type="button"
            onClick={() => {
              void copyLink();
            }}
            className="btn btn-secondary"
          >
            Salin tautan
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? "Menyimpan..." : "Simpan formulir"}
          </button>
        </div>
      </div>

      {message ? (
        <div
          className={`mb-5 ${messageTone === "error" ? "alert-error" : "alert-info"}`}
          role="status"
        >
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="panel rounded-xl p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="panel-title">Informasi kegiatan</h2>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <span>Status absensi</span>
                <select
                  className="field-sm w-auto"
                  value={config.status}
                  onChange={(event) =>
                    updateConfig((current) => ({
                      ...current,
                      status:
                        event.target.value === "open" ? "open" : "closed",
                    }))
                  }
                >
                  <option value="open">Dibuka</option>
                  <option value="closed">Ditutup</option>
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="field-label">Judul kegiatan</label>
                <input
                  type="text"
                  className="field-sm"
                  placeholder="Contoh: Rapat Koordinasi Bulanan UP3 Kediri"
                  value={config.title}
                  onChange={(event) =>
                    updateConfig((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="field-label">Tanggal kegiatan</label>
                <input
                  type="date"
                  className="field-sm"
                  value={config.eventDate ?? ""}
                  onChange={(event) =>
                    updateConfig((current) => ({
                      ...current,
                      eventDate: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="field-label">Batas waktu otomatis</label>
                <input
                  type="datetime-local"
                  className="field-sm"
                  value={toLocalInput(config.closesAt)}
                  onChange={(event) =>
                    updateConfig((current) => ({
                      ...current,
                      closesAt: fromLocalInput(event.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <label className="field-label">Maksimum peserta</label>
                <input
                  type="number"
                  min={0}
                  className="field-sm"
                  placeholder="Kosong = tanpa batas"
                  value={config.maxResponses ?? ""}
                  onChange={(event) =>
                    updateConfig((current) => ({
                      ...current,
                      maxResponses: event.target.value
                        ? Number(event.target.value)
                        : null,
                    }))
                  }
                />
              </div>
              <div>
                <label className="field-label">Token QR</label>
                <input
                  type="text"
                  readOnly
                  className="field-sm font-mono text-xs text-slate-600"
                  value={config.token}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">
                  Deskripsi untuk peserta (opsional)
                </label>
                <textarea
                  className="field-sm min-h-20 resize-y"
                  value={config.description ?? ""}
                  onChange={(event) =>
                    updateConfig((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">
                  Pesan konfirmasi setelah submit
                </label>
                <textarea
                  className="field-sm min-h-16 resize-y"
                  value={config.confirmationMessage ?? ""}
                  onChange={(event) =>
                    updateConfig((current) => ({
                      ...current,
                      confirmationMessage: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </section>

          <section className="panel rounded-xl p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="panel-title">Halaman form</h2>
              <button
                type="button"
                onClick={addPage}
                className="btn btn-secondary btn-sm"
              >
                Tambah halaman
              </button>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {config.pages.map((page, index) => {
                const active = page.id === activePage?.id;
                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => setActivePageId(page.id)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? "bg-brand-700 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {index + 1}. {page.title}
                  </button>
                );
              })}
            </div>

            {activePage ? (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    className="field-sm"
                    value={activePage.title}
                    onChange={(event) =>
                      updatePage(activePage.id, {
                        title: event.target.value,
                      })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Deskripsi halaman (opsional)"
                    className="field-sm"
                    value={activePage.description ?? ""}
                    onChange={(event) =>
                      updatePage(activePage.id, {
                        description: event.target.value,
                      })
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() => deletePage(activePage.id)}
                  className="btn btn-danger"
                >
                  Hapus halaman ini
                </button>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-600">
                    {activeQuestions.length} pertanyaan di halaman ini
                  </p>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="btn btn-primary"
                  >
                    Tambah pertanyaan
                  </button>
                </div>

                <div className="space-y-4">
                  {activeQuestions.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center">
                      <p className="text-sm font-semibold text-slate-700">
                        Belum ada pertanyaan
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Tambahkan pertanyaan agar peserta tahu data yang perlu
                        diisi.
                      </p>
                    </div>
                  ) : (
                    activeQuestions.map((question, index) => (
                      <div
                        key={question.id}
                        className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-500">
                            Pertanyaan {index + 1}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => moveQuestion(question.id, -1)}
                              className="btn btn-secondary btn-sm"
                            >
                              Naik
                            </button>
                            <button
                              type="button"
                              onClick={() => moveQuestion(question.id, 1)}
                              className="btn btn-secondary btn-sm"
                            >
                              Turun
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteQuestion(question.id)}
                              className="btn btn-danger btn-sm"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                              Label pertanyaan
                            </label>
                            <input
                              type="text"
                              className="field-sm"
                              value={question.label}
                              onChange={(event) =>
                                updateQuestion(question.id, {
                                  label: event.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                              Jenis pertanyaan
                            </label>
                            <select
                              className="field-sm"
                              value={question.type}
                              onChange={(event) =>
                                updateQuestion(question.id, {
                                  type: event.target.value as QuestionType,
                                })
                              }
                            >
                              {QUESTION_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                              Validasi
                            </label>
                            <select
                              className="field-sm"
                              value={question.validation ?? "none"}
                              onChange={(event) =>
                                updateQuestion(question.id, {
                                  validation: event.target
                                    .value as QuestionValidation,
                                })
                              }
                            >
                              {VALIDATION_OPTIONS.map((option) => (
                                <option
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                              Pindahkan ke halaman
                            </label>
                            <select
                              className="field-sm"
                              value={activePage.id}
                              onChange={(event) =>
                                moveQuestionToPage(
                                  question.id,
                                  event.target.value,
                                )
                              }
                            >
                              {config.pages.map((page, pageIndexValue) => (
                                <option key={page.id} value={page.id}>
                                  {pageIndexValue + 1}. {page.title}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                              Placeholder (opsional)
                            </label>
                            <input
                              type="text"
                              className="field-sm"
                              value={question.placeholder ?? ""}
                              onChange={(event) =>
                                updateQuestion(question.id, {
                                  placeholder: event.target.value,
                                })
                              }
                            />
                          </div>
                          {needsOptions(question.type) ? (
                            <div className="sm:col-span-2">
                              <label className="mb-1 block text-xs font-medium text-slate-600">
                                Opsi (satu per baris)
                              </label>
                              <textarea
                                className="field-sm min-h-24 resize-y"
                                value={(question.options ?? []).join("\n")}
                                onChange={(event) =>
                                  updateQuestion(question.id, {
                                    options: event.target.value.split("\n"),
                                  })
                                }
                              />
                            </div>
                          ) : null}
                          <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                              checked={Boolean(question.required)}
                              onChange={(event) =>
                                updateQuestion(question.id, {
                                  required: event.target.checked,
                                })
                              }
                            />
                            Wajib diisi peserta
                          </label>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="panel rounded-xl p-5">
            <h2 className="panel-title">QR Code peserta</h2>
            <p className="mb-4 mt-1 text-sm leading-relaxed text-slate-600">
              QR unik untuk kegiatan ini. Peserta memindai QR untuk membuka form
              tanpa login.
            </p>
            {formUrl ? <QRCodeGenerator value={formUrl} /> : null}
            <button
              type="button"
              onClick={() => setPrintQr(true)}
              className="btn btn-secondary mt-3 w-full"
            >
              Cetak QR Code
            </button>
          </section>

          <section className="panel rounded-xl p-5">
            <h2 className="panel-title">Tautan peserta</h2>
            <p className="mt-3 break-all rounded-lg bg-slate-50 p-3 font-mono text-xs text-brand-800">
              {formUrl}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  void copyLink();
                }}
                className="btn btn-secondary w-full"
              >
                Salin tautan
              </button>
              <button
                type="button"
                onClick={() => window.open(previewUrl, "_blank", "noopener")}
                className="btn btn-secondary w-full"
              >
                Buka pratinjau
              </button>
            </div>
          </section>
        </aside>
      </div>

      {printQr ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 print:static print:bg-white">
          <div className="max-h-[90vh] w-full max-w-sm overflow-auto rounded-xl bg-white p-6 print:max-w-none print:rounded-none print:p-0">
            <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
              <p className="text-sm font-bold text-ink">Cetak QR absensi</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-primary btn-sm"
                >
                  Cetak
                </button>
                <button
                  type="button"
                  onClick={() => setPrintQr(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Tutup
                </button>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 text-center print:mt-8">
              <p className="text-sm font-extrabold text-brand-800">
                PT PLN (Persero) UP3 Kediri
              </p>
              <p className="text-base font-bold text-ink">{config.title}</p>
              <p className="text-sm text-slate-600">{config.eventDate ?? ""}</p>
              <QRCodeCanvas value={formUrl} size={240} marginSize={2} />
              <p className="text-sm font-medium text-slate-700">
                Pindai QR untuk mengisi absensi
              </p>
              <p className="max-w-xs break-all font-mono text-[10px] text-slate-500">
                {formUrl}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
