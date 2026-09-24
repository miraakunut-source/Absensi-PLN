export type QuestionType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "time"
  | "select"
  | "radio"
  | "checkbox";

export type QuestionValidation = "none" | "email" | "number";

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  validation?: QuestionValidation;
}

export interface FormPage {
  id: string;
  title: string;
  description?: string;
  questionIds: string[];
}

export type FormStatus = "open" | "closed";

export type FormOpenState =
  | "open"
  | "closed_manual"
  | "not_started"
  | "deadline_passed"
  | "max_reached";

export interface FormConfig {
  id: string;
  token: string;
  title: string;
  description?: string;
  eventDate?: string;
  status: FormStatus;
  opensAt?: string | null;
  closesAt?: string | null;
  maxResponses?: number | null;
  confirmationMessage?: string;
  pages: FormPage[];
  questions: Question[];
  createdAt?: string;
  updatedAt?: string;
}

export interface FormResponse {
  id: string;
  formId: string;
  answers: Record<string, string | string[]>;
  respondentName?: string | null;
  signatureUrl?: string | null;
  signatureDataUrl?: string | null;
  createdAt: string;
}
