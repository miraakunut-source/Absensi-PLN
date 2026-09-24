"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { submitResponse } from "@/lib/formStorage";
import type { FormConfig, Question } from "@/types";

const SignaturePad = dynamic(() => import("./SignaturePad"), {
  ssr: false,
  loading: () => (
    <div className="h-48 w-full animate-pulse rounded-lg border border-dashed border-slate-300 bg-slate-50" />
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

  if (question.type === "textarea") {
    return (
      <textarea
        id={question.id}
        className="field min-h-32 resize-y"
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
        className="field"
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

  if (question.type === "radio") {
    return (
      <div className="space-y-2" role="radiogroup" aria-label={question.label}>
        {options.map((option) => {
          const checked = value === option;
          return (
            <label
              key={option}
              className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-base transition ${
                checked
                  ? "border-brand-600 bg-brand-50 text-brand-900 ring-1 ring-brand-600"
                  : "border-slate-300 bg-white text-slate-800 hover:border-slate-400"
              }`}
            >
              <input
                type="radio"
                name={question.id}
                className="h-4 w-4 shrink-0 border-slate-300 text-brand-600 focus:ring-brand-600"
                value={option}
                checked={checked}
                onChange={() => onChange(option)}
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>
    );
  }

  if (question.type === "checkbox") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-2" role="group" aria-label={question.label}>
        {options.map((option) => {
          const checked = selected.includes(option);
          return (
            <label
              key={option}
              className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-base transition ${
                checked
                  ? "border-brand-600 bg-brand-50 text-brand-900 ring-1 ring-brand-600"
                  : "border-slate-300 bg-white text-slate-800 hover:border-slate-400"
              }`}
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                checked={checked}
                onChange={() => {
                  const next = checked
                    ? selected.filter((item) => item !== option)
                    : [...selected, option];
                  onChange(next);
                }}
              />
              <span>{option}</span>
            </label>
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
      className="field"
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
        "Tanda tangan masih kosong. bubuhkan tanda tangan pada kolom yang tersedia sebelum mengirim.",
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

      await submitResponse({
        formId: config.id,
        answers,
        signatureDataUrl: signature,
        respondentName,
      });
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
      <div className="panel rounded-xl border-t-4 border-t-emerald-500 p-6 text-center sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-xl font-bold text-white">
          OK
        </div>
        <h2 className="mt-4 text-xl font-bold text-ink">Absensi terkirim</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {config.confirmationMessage ||
            "Terima kasih. Data absensi Anda sudah diterima panitia."}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={resetForm} className="btn btn-secondary">
            Isi absensi lagi
          </button>
        </div>
      </div>
    );
  }

  if (!currentPage) {
    return (
      <div className="alert-warn">
        Formulir ini belum memiliki halaman isian. Hubungi admin untuk
        melengkapi pengaturan form.
      </div>
    );
  }

  const progress = ((pageIndex + 1) / pages.length) * 100;

  return (
    <div className="panel rounded-xl p-5 sm:p-7">
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-700">
              Halaman {pageIndex + 1} dari {pages.length}
            </p>
            <h2 className="mt-1 text-lg font-bold text-ink">
              {currentPage.title}
            </h2>
            {currentPage.description ? (
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                {currentPage.description}
              </p>
            ) : null}
          </div>
          <span className="status-pill bg-brand-50 text-brand-800">
            {pageQuestions.length} pertanyaan
          </span>
        </div>
        <div
          className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progres pengisian"
        >
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        {config.description && pageIndex === 0 ? (
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            {config.description}
          </p>
        ) : null}
      </div>

      <div className="space-y-6">
        {pageQuestions.map((question) => {
          const message = validateQuestion(
            question,
            answers[question.id],
          );
          const showError =
            message !== null &&
            (message !== "wajib diisi" ||
              (answers[question.id] !== undefined &&
                isEmptyValue(answers[question.id]) === false));

          return (
            <div key={question.id}>
              <label
                htmlFor={question.id}
                className="field-label"
              >
                {question.label}
                {question.required ? (
                  <span className="ml-1 text-red-600" aria-hidden>
                    *
                  </span>
                ) : null}
              </label>
              <QuestionField
                question={question}
                value={answers[question.id]}
                onChange={(value) => setAnswer(question.id, value)}
              />
              {showError && message && message !== "wajib diisi" ? (
                <p className="mt-1.5 text-sm font-medium text-red-600">
                  {message}
                </p>
              ) : null}
            </div>
          );
        })}

        {isLastPage ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-800">
              Tanda tangan
              <span className="ml-1 text-red-600" aria-hidden>
                *
              </span>
            </p>
            <SignaturePad onChange={setSignature} />
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="alert-error mt-5" role="alert">
          {error}
        </div>
      ) : null}

      {disabled ? (
        <div className="alert-warn mt-5">
          Formulir sudah ditutup. Anda tidak dapat mengirim absensi melalui
          tautan ini.
        </div>
      ) : null}

      <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={goPrev}
          disabled={pageIndex === 0 || submitting || disabled}
          className="btn btn-secondary w-full sm:w-auto"
        >
          Sebelumnya
        </button>

        {isLastPage ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || disabled}
            className="btn btn-primary w-full sm:w-auto"
          >
            {submitting ? "Mengirim absensi..." : "Kirim absensi"}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            disabled={submitting || disabled}
            className="btn btn-primary w-full sm:w-auto"
          >
            Lanjutkan
          </button>
        )}
      </div>
    </div>
  );
}
