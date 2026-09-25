import type { ReactNode } from "react";

export const CONTROL_CLASS =
  "w-full rounded-lg border border-line-strong bg-surface px-3.5 py-3 text-base text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-sunken disabled:text-muted";

export const CONTROL_CLASS_SM =
  "w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100";

interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
}

export default function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className,
}: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="type-label mb-1.5 block">
        {label}
        {required ? (
          <span className="ml-1 text-danger-600" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-sm font-medium text-danger-700">{error}</p>
      ) : hint ? (
        <p className="type-caption mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
}

interface ChoiceOptionProps {
  type: "radio" | "checkbox";
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
  disabled?: boolean;
}

export function ChoiceOption({
  type,
  name,
  value,
  checked,
  onChange,
  children,
  disabled,
}: ChoiceOptionProps) {
  return (
    <label
      className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-base transition-colors ${
        checked
          ? "border-brand-600 bg-brand-50 text-brand-900"
          : "border-line-strong bg-surface text-body hover:border-brand-300"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 shrink-0 border-line-strong accent-brand-600"
      />
      <span className="min-w-0">{children}</span>
    </label>
  );
}
