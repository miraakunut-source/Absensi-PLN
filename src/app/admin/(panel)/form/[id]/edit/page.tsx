"use client";

import { QRCodeCanvas } from "qrcode.react";
import { useCallback, useEffect, use, useState } from "react";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card, { CardBody, CardFooter, CardHeader } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Field, { ChoiceOption, CONTROL_CLASS_SM } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import QRCodeGenerator from "./QRCodeGenerator";
import { createBlankForm } from "@/lib/defaultForm";
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
  const [isDraft, setIsDraft] = useState(false);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [printQr, setPrintQr] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const draftRequested =
          new URLSearchParams(window.location.search).get("draft") === "1";
        const existing = draftRequested ? null : await getConfig(formId);
        if (cancelled) return;
        if (!existing) {
          if (!draftRequested) {
            setNotFound(true);
            return;
          }
          const blank = createBlankForm({
            id: formId,
            title: "Kegiatan Absensi Baru",
          });
          setConfig(blank);
          setIsDraft(true);
          setActivePageId(blank.pages[0]?.id ?? null);
          setFormUrl(`${window.location.origin}/absen/${blank.token}`);
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
      setIsDraft(false);
      window.history.replaceState(null, "", window.location.pathname);
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
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        <Card className="mx-auto max-w-xl">
          <div className="type-body px-5 py-6 text-center text-muted" role="status">
            Memuat editor form...
          </div>
        </Card>
      </div>
    );
  }

  if (notFound || !config) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        <Card className="mx-auto max-w-xl">
          <EmptyState
            compact
            title="Form tidak ditemukan"
            description="Kegiatan dengan tautan ini tidak ada atau sudah dihapus. Kembali ke dashboard untuk memilih kegiatan lain."
            action={
              <Button href="/admin/dashboard">Kembali ke dashboard</Button>
            }
          />
        </Card>
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
      <PageHeader
        title="Atur kegiatan absensi"
        description="Sesuaikan informasi kegiatan, halaman form, pertanyaan, dan QR Code untuk peserta."
        actions={
          <>
            <Button href="/admin/dashboard" variant="secondary">
              Dashboard
            </Button>
            <Button
              variant="secondary"
              disabled={isDraft}
              onClick={() => {
                window.open(previewUrl, "_blank", "noopener");
              }}
            >
              Pratinjau form
            </Button>
            <Button
              variant="secondary"
              disabled={isDraft}
              onClick={() => {
                void copyLink();
              }}
            >
              Salin tautan
            </Button>
            <Button variant="accent" onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan formulir"}
            </Button>
          </>
        }
      />

      {isDraft ? (
        <Alert tone="warn" title="Formulir baru belum disimpan" className="mb-5">
          Pengaturan di halaman ini hanya ada di peramban Anda. Tekan{" "}
          <strong>Simpan formulir</strong> untuk menyimpannya ke database. Jika
          Anda kembali ke dashboard tanpa menyimpan, formulir ini tidak akan
          tersimpan dan tautan peserta belum bisa dibuka.
        </Alert>
      ) : null}

      {message ? (
        <Alert
          tone={messageTone === "error" ? "danger" : "info"}
          className="mb-6"
        >
          {message}
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Informasi kegiatan"
              actions={
                <Field
                  label="Status absensi"
                  htmlFor="form-status"
                  className="w-44"
                >
                  <select
                    id="form-status"
                    className={CONTROL_CLASS_SM}
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
                </Field>
              }
            />
            <CardBody>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Judul kegiatan"
                  htmlFor="form-title"
                  className="sm:col-span-2"
                >
                  <input
                    id="form-title"
                    type="text"
                    className={CONTROL_CLASS_SM}
                    placeholder="Contoh: Rapat Koordinasi Bulanan UP3 Kediri"
                    value={config.title}
                    onChange={(event) =>
                      updateConfig((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="Tanggal kegiatan" htmlFor="form-event-date">
                  <input
                    id="form-event-date"
                    type="date"
                    className={CONTROL_CLASS_SM}
                    value={config.eventDate ?? ""}
                    onChange={(event) =>
                      updateConfig((current) => ({
                        ...current,
                        eventDate: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field
                  label="Batas waktu otomatis"
                  htmlFor="form-closes-at"
                >
                  <input
                    id="form-closes-at"
                    type="datetime-local"
                    className={CONTROL_CLASS_SM}
                    value={toLocalInput(config.closesAt)}
                    onChange={(event) =>
                      updateConfig((current) => ({
                        ...current,
                        closesAt: fromLocalInput(event.target.value),
                      }))
                    }
                  />
                </Field>
                <Field
                  label="Maksimum peserta"
                  htmlFor="form-max-participants"
                >
                  <input
                    id="form-max-participants"
                    type="number"
                    min={0}
                    className={CONTROL_CLASS_SM}
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
                </Field>
                <Field label="Token QR" htmlFor="form-token">
                  <input
                    id="form-token"
                    type="text"
                    readOnly
                    className={`${CONTROL_CLASS_SM} font-mono text-muted`}
                    value={config.token}
                  />
                </Field>
                <Field
                  label="Deskripsi untuk peserta (opsional)"
                  htmlFor="form-description"
                  className="sm:col-span-2"
                >
                  <textarea
                    id="form-description"
                    className={`${CONTROL_CLASS_SM} min-h-20 resize-y`}
                    value={config.description ?? ""}
                    onChange={(event) =>
                      updateConfig((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field
                  label="Pesan konfirmasi setelah submit"
                  htmlFor="form-confirmation-message"
                  className="sm:col-span-2"
                >
                  <textarea
                    id="form-confirmation-message"
                    className={`${CONTROL_CLASS_SM} min-h-16 resize-y`}
                    value={config.confirmationMessage ?? ""}
                    onChange={(event) =>
                      updateConfig((current) => ({
                        ...current,
                        confirmationMessage: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
            </CardBody>
          </Card>

          {activePage ? (
            <Card className="mt-4">
              <CardHeader
                title="Halaman form"
                description="Atur judul, deskripsi, dan pilihan halaman isian."
                actions={
                  <Button variant="secondary" size="sm" onClick={addPage}>
                    Tambah halaman
                  </Button>
                }
              />
              <CardBody className="space-y-5">
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label="Pilih halaman form"
                >
                    {config.pages.map((page, index) => {
                      const active = page.id === activePage.id;
                      return (
                        <Button
                          key={page.id}
                          variant={active ? "primary" : "secondary"}
                          size="sm"
                          className="min-w-0 max-w-full whitespace-normal break-words"
                          aria-pressed={active}
                          onClick={() => setActivePageId(page.id)}
                        >
                          {index + 1}. {page.title}
                        </Button>
                      );
                    })}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Judul halaman"
                    htmlFor={`page-title-${activePage.id}`}
                  >
                    <input
                      id={`page-title-${activePage.id}`}
                      type="text"
                      className={CONTROL_CLASS_SM}
                      value={activePage.title}
                      onChange={(event) =>
                        updatePage(activePage.id, {
                          title: event.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field
                    label="Deskripsi halaman (opsional)"
                    htmlFor={`page-description-${activePage.id}`}
                  >
                    <input
                      id={`page-description-${activePage.id}`}
                      type="text"
                      className={CONTROL_CLASS_SM}
                      value={activePage.description ?? ""}
                      onChange={(event) =>
                        updatePage(activePage.id, {
                          description: event.target.value,
                        })
                      }
                    />
                  </Field>
                </div>
              </CardBody>
            </Card>
          ) : null}

          {activePage ? (
            <Card className="mt-4">
              <CardHeader
                title={`Pertanyaan pada halaman ${activePage.title}`}
                description="Urutan pertanyaan mengikuti urutan di bawah."
                actions={
                  <Button size="sm" onClick={addQuestion}>
                    Tambah pertanyaan
                  </Button>
                }
              />
              <CardBody className="space-y-4">
                    {activeQuestions.length === 0 ? (
                      <EmptyState
                        compact
                        title="Belum ada pertanyaan"
                        description="Tambahkan pertanyaan agar peserta tahu data yang perlu diisi."
                        action={
                          <Button onClick={addQuestion}>
                            Tambah pertanyaan
                          </Button>
                        }
                      />
                    ) : (
                      activeQuestions.map((question, index) => {
                        const typeLabel =
                          QUESTION_TYPES.find(
                            (type) => type.value === question.type,
                          )?.label ?? question.type;

                        return (
                          <Card key={question.id}>
                            <CardHeader
                              title={`Pertanyaan ${index + 1}`}
                              actions={
                                <>
                                  <Badge tone="brand">{typeLabel}</Badge>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() =>
                                      moveQuestion(question.id, -1)
                                    }
                                  >
                                    Naik
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() =>
                                      moveQuestion(question.id, 1)
                                    }
                                  >
                                    Turun
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() =>
                                      deleteQuestion(question.id)
                                    }
                                  >
                                    Hapus
                                  </Button>
                                </>
                              }
                            />
                            <CardBody>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                  label="Label pertanyaan"
                                  htmlFor={`question-label-${question.id}`}
                                  className="sm:col-span-2"
                                >
                                  <input
                                    id={`question-label-${question.id}`}
                                    type="text"
                                    className={CONTROL_CLASS_SM}
                                    value={question.label}
                                    onChange={(event) =>
                                      updateQuestion(question.id, {
                                        label: event.target.value,
                                      })
                                    }
                                  />
                                </Field>
                                <Field
                                  label="Jenis pertanyaan"
                                  htmlFor={`question-type-${question.id}`}
                                >
                                  <select
                                    id={`question-type-${question.id}`}
                                    className={CONTROL_CLASS_SM}
                                    value={question.type}
                                    onChange={(event) =>
                                      updateQuestion(question.id, {
                                        type: event.target
                                          .value as QuestionType,
                                      })
                                    }
                                  >
                                    {QUESTION_TYPES.map((type) => (
                                      <option
                                        key={type.value}
                                        value={type.value}
                                      >
                                        {type.label}
                                      </option>
                                    ))}
                                  </select>
                                </Field>
                                <Field
                                  label="Validasi"
                                  htmlFor={`question-validation-${question.id}`}
                                >
                                  <select
                                    id={`question-validation-${question.id}`}
                                    className={CONTROL_CLASS_SM}
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
                                </Field>
                                <Field
                                  label="Pindahkan ke halaman"
                                  htmlFor={`question-destination-${question.id}`}
                                >
                                  <select
                                    id={`question-destination-${question.id}`}
                                    className={CONTROL_CLASS_SM}
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
                                </Field>
                                <Field
                                  label="Placeholder (opsional)"
                                  htmlFor={`question-placeholder-${question.id}`}
                                >
                                  <input
                                    id={`question-placeholder-${question.id}`}
                                    type="text"
                                    className={CONTROL_CLASS_SM}
                                    value={question.placeholder ?? ""}
                                    onChange={(event) =>
                                      updateQuestion(question.id, {
                                        placeholder: event.target.value,
                                      })
                                    }
                                  />
                                </Field>
                                {needsOptions(question.type) ? (
                                  <Field
                                    label="Opsi (satu per baris)"
                                    htmlFor={`question-options-${question.id}`}
                                    className="sm:col-span-2"
                                  >
                                    <textarea
                                      id={`question-options-${question.id}`}
                                      className={`${CONTROL_CLASS_SM} min-h-24 resize-y`}
                                      value={(question.options ?? []).join(
                                        "\n",
                                      )}
                                      onChange={(event) =>
                                        updateQuestion(question.id, {
                                          options: event.target.value.split(
                                            "\n",
                                          ),
                                        })
                                      }
                                    />
                                  </Field>
                                ) : null}
                                <div className="sm:col-span-2">
                                  <ChoiceOption
                                    type="checkbox"
                                    name={`question-${question.id}-required`}
                                    value="required"
                                    checked={Boolean(question.required)}
                                    onChange={() =>
                                      updateQuestion(question.id, {
                                        required: !Boolean(question.required),
                                      })
                                    }
                                  >
                                    Wajib diisi peserta
                                  </ChoiceOption>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        );
                      })
                    )}
              </CardBody>
              <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="type-body text-muted">
                  {activeQuestions.length} pertanyaan di halaman ini
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="danger"
                    onClick={() => deletePage(activePage.id)}
                  >
                    Hapus halaman ini
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ) : null}
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader
              title="QR Code peserta"
              description="QR unik untuk kegiatan ini. Peserta memindai QR untuk membuka form tanpa login."
            />
            <CardBody>
              {isDraft ? (
                <Alert tone="warn">
                  QR Code baru bisa dibuat setelah formulir disimpan. Tekan
                  Simpan formulir terlebih dahulu.
                </Alert>
              ) : (
                <>
                  {formUrl ? <QRCodeGenerator value={formUrl} /> : null}
                  <Button
                    variant="secondary"
                    fullWidth
                    className="mt-4"
                    onClick={() => setPrintQr(true)}
                  >
                    Cetak QR Code
                  </Button>
                </>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Tautan peserta" />
            <CardBody>
              {isDraft ? (
                <Alert tone="warn">
                  Tautan peserta baru aktif setelah formulir disimpan.
                </Alert>
              ) : (
                <>
                  <p className="type-caption break-all rounded-md bg-sunken p-4 font-mono text-brand-800">
                    {formUrl}
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => {
                        void copyLink();
                      }}
                    >
                      Salin tautan
                    </Button>
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => {
                        window.open(previewUrl, "_blank", "noopener");
                      }}
                    >
                      Buka pratinjau
                    </Button>
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </aside>
      </div>

      {printQr ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 print:static print:bg-surface">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="print-qr-title"
            className="max-h-[90vh] w-full max-w-sm overflow-auto rounded-xl border border-line bg-surface p-6 shadow-lift print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
          >
            <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
              <p id="print-qr-title" className="type-heading">
                Cetak QR absensi
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    window.print();
                  }}
                >
                  Cetak
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPrintQr(false)}
                >
                  Tutup
                </Button>
              </div>
            </div>
            <div className="flex flex-col items-center gap-4 text-center print:mt-8">
              <p className="type-subtitle text-brand-800">
                PT PLN (Persero) UP3 Kediri
              </p>
              <p className="type-title max-w-xs break-words">{config.title}</p>
              <p className="type-caption">{config.eventDate ?? ""}</p>
              <QRCodeCanvas value={formUrl} size={240} marginSize={2} />
              <p className="type-body text-body">
                Pindai QR untuk mengisi absensi
              </p>
              <p className="type-caption max-w-xs break-all font-mono">
                {formUrl}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
