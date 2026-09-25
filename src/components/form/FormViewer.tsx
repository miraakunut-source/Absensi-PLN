"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Field, { ChoiceOption, CONTROL_CLASS } from "@/components/ui/Field";
import ProgressSteps from "@/components/ui/ProgressSteps";
import type { FormConfig, Question } from "@/types";

const SignaturePad = dynamic(() => import("./SignaturePad"), {
  ssr: false,
  loading: () => (
    <div className="h-48 w-full animate-pulse rounded-lg border border-dashed border-line-strong bg-sunken" />
  ),
});

type Answers = Record<string, string | string[]>;

interface FormViewerProps {
  config: FormConfig;
  disabled?: boolean;
}

function isEmptyValue(value: string | string[] | undefined): boolean {
  if (value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  return value.trim() === "";
}

function validateQuestion(
  question: Question,
  value: string | string[] | undefined,
): string | null {
  if (isEmptyValue(value)) {
    return question.required ? "wajib diisi" : null;
  }

  const text = Array.isArray(value) ? value.join(", ") : (value ?? "");

  if (question.validation === "email") {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
    if (!ok) return "format email belum benar";
  }

  if (question.validation === "number" || question.type === "number") {
    if (text.trim() !== "" && Number.isNaN(Number(text))) {
      return "harus berupa angka";
    }
  }

  return null;
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string | string[] | undefined;
  onChange: (next: string | string[]) => void;
}) {
  const options = (question.options ?? []).filter(
    (option) => option.trim() !== "",
  );
  const groupId = `${question.id}-group`;

  if (question.type === "textarea") {
    return (
      <textarea
        id={question.id}
        className={`${CONTROL_CLASS} min-h-32 resize-y`}
        placeholder={question.placeholder}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (question.type === "select") {
    return (
      <select
        id={question.id}
        className={`${CONTROL_CLASS} appearance-none bg-[length:16px] pr-10`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%235f7186'%3E%3Cpath fill-rule='evenodd' d='M5.5 7.5 10 12l4.5-4.5' clip-rule='evenodd'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.75rem center",
        }}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Pilih salah satu</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (question.type === "radio" || question.type === "checkbox") {
    const choiceType = question.type;
    const selected = Array.isArray(value) ? value : [];
    const stringValue = typeof value === "string" ? value : "";
    return (
      <div className="space-y-2.5" id={groupId} role="group">
        {options.map((option) => {
          const checked =
            question.type === "radio"
              ? stringValue === option
              : selected.includes(option);
          return (
            <ChoiceOption
              key={option}
              type={choiceType}
              name={question.id}
              value={option}
              checked={checked}
              onChange={() => {
                if (choiceType === "radio") {
                  onChange(option);
                  return;
                }
                onChange(
                  checked
                    ? selected.filter((item) => item !== option)
                    : [...selected, option],
                );
              }}
            >
              {option}
            </ChoiceOption>
          );
        })}
      </div>
    );
  }

  const inputType =
    question.type === "number"
      ? "number"
      : question.type === "date"
        ? "date"
        : question.type === "time"
          ? "time"
          : "text";

  return (
    <input
      id={question.id}
      type={inputType}
      inputMode={
        question.validation === "email"
          ? "email"
          : question.validation === "number"
            ? "numeric"
            : undefined
      }
      className={CONTROL_CLASS}
      placeholder={question.placeholder}
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export default function FormViewer({ config, disabled }: FormViewerProps) {
  const pages = config.pages;
  const [pageIndex, setPageIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const currentPage = pages[pageIndex];
  const isLastPage = pageIndex === pages.length - 1;
  const pageQuestions = useMemo(() => {
    if (!currentPage) return [];
    const ids = new Set(currentPage.questionIds);
    return config.questions.filter((question) => ids.has(question.id));
  }, [config.questions, currentPage]);

  const fieldErrors = pageQuestions.map((question) => ({
    question,
    message: validateQuestion(question, answers[question.id]),
  }));
  const invalid = fieldErrors.filter(
    (item): item is { question: Question; message: string } =>
      item.message !== null,
  );

  const setAnswer = (id: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const describeInvalid = (items: { question: Question; message: string }[]) =>
    items
      .map((item) => `${item.question.label} (${item.message})`)
      .join(", ");

  const goNext = () => {
    if (invalid.length > 0) {
      setError(`Lengkapi isian berikut: ${describeInvalid(invalid)}`);
      return;
    }
    setError(null);
    setPageIndex((index) => Math.min(index + 1, pages.length - 1));
  };

  const goPrev = () => {
    setError(null);
    setPageIndex((index) => Math.max(index - 1, 0));
  };

  const handleSubmit = async () => {
    if (disabled) {
      setError("Formulir sudah ditutup. Pengiriman absensi tidak diterima.");
      return;
    }
    if (invalid.length > 0) {
      setError(`Lengkapi isian berikut: ${describeInvalid(invalid)}`);
      return;
    }
    if (!signature) {
      setError(
        "Tanda tangan masih kosong. Bubuhkan tanda tangan pada kolom yang tersedia sebelum mengirim.",
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const nameValue = answers.nama;
      const respondentName = Array.isArray(nameValue)
        ? nameValue.join(", ")
        : (nameValue ?? "");

      const response = await fetch("/api/public/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: config.id,
          answers,
          signatureDataUrl: signature,
          respondentName,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          data.error ||
            "Absensi gagal dikirim. Periksa koneksi internet Anda lalu coba lagi.",
        );
      }

      setSubmitted(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Absensi gagal dikirim. Periksa koneksi internet Anda lalu coba lagi.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setAnswers({});
    setSignature(null);
    setError(null);
    setPageIndex(0);
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="space-y-5">
        <Alert tone="success" title="Absensi terkirim">
          {config.confirmationMessage ||
            "Terima kasih. Data absensi Anda sudah diterima panitia."}
        </Alert>
        <Button variant="secondary" onClick={resetForm} fullWidth>
          Isi absensi lagi
        </Button>
      </div>
    );
  }

  if (!currentPage) {
    return (
      <Alert tone="warn">
        Formulir ini belum memiliki halaman isian. Hubungi admin untuk
        melengkapi pengaturan form.
      </Alert>
    );
  }

  return (
    <Card className="p-5 sm:p-7">
      <div className="border-b border-line pb-4">
        <h2 className="type-title break-words">{currentPage.title}</h2>
        {currentPage.description ? (
          <p className="type-body mt-2 text-muted">{currentPage.description}</p>
        ) : null}
        <div className="mt-4">
          <ProgressSteps current={pageIndex + 1} total={pages.length} />
        </div>
      </div>

      <div className="space-y-7 pt-5">
        {pageQuestions.map((question) => {
          const message = validateQuestion(
            question,
            answers[question.id],
          );
          const showError =
            message !== null &&
            message !== "wajib diisi" &&
            !isEmptyValue(answers[question.id]);

          return (
            <Field
              key={question.id}
              label={question.label}
              htmlFor={question.id}
              required={question.required}
              error={showError ? message : null}
            >
              <QuestionField
                question={question}
                value={answers[question.id]}
                onChange={(value) => setAnswer(question.id, value)}
              />
            </Field>
          );
        })}

        {isLastPage ? (
          <div className="rounded-lg border border-line bg-sunken p-4 shadow-panel sm:p-5">
            <p className="type-heading">
              Tanda tangan
              <span className="ml-1 text-danger-600" aria-hidden>
                *
              </span>
            </p>
            <p className="type-caption mb-3 mt-1">
              Tanda tangan wajib diisi sebelum absensi dikirim.
            </p>
            <SignaturePad onChange={setSignature} />
          </div>
        ) : null}
      </div>

      {error ? (
        <Alert tone="danger" className="mt-6">
          {error}
        </Alert>
      ) : null}

      {disabled ? (
        <Alert tone="warn" className="mt-6">
          Formulir sudah ditutup. Anda tidak dapat mengirim absensi melalui
          tautan ini.
        </Alert>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="secondary"
          onClick={goPrev}
          disabled={pageIndex === 0 || submitting || disabled}
          fullWidth
          className="sm:w-auto"
        >
          Sebelumnya
        </Button>

        {isLastPage ? (
          <Button
            variant="accent"
            size="lg"
            onClick={() => {
              void handleSubmit();
            }}
            disabled={submitting || disabled}
            fullWidth
            className="sm:w-auto"
          >
            {submitting ? "Mengirim absensi..." : "Kirim absensi"}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            onClick={goNext}
            disabled={submitting || disabled}
            fullWidth
            className="sm:w-auto"
          >
            Lanjutkan
          </Button>
        )}
      </div>
    </Card>
  );
}
