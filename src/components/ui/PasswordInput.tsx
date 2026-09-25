"use client";

import { useState, type InputHTMLAttributes } from "react";
import { CONTROL_CLASS } from "./Field";

type PasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "className"
> & { className?: string };

export default function PasswordInput({
  className,
  ...inputProps
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...inputProps}
        type={visible ? "text" : "password"}
        suppressHydrationWarning
        className={`${CONTROL_CLASS} pr-12 ${className ?? ""}`}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        suppressHydrationWarning
        aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-muted transition-colors hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-brand-600"
      >
        {visible ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden
          >
            <path d="M3 3l18 18" />
            <path d="M10.6 6.2A8.7 8.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17.4 17.4 0 0 1-3.3 4" />
            <path d="M6.6 6.7C4 8.4 2.5 12 2.5 12S6 18 12 18a9 9 0 0 0 3.9-.9" />
            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden
          >
            <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
