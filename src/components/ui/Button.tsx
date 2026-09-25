import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "accent"
  | "secondary"
  | "ghost"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex select-none items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-55";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 focus-visible:outline-brand-600",
  accent:
    "bg-gold-500 text-ink hover:bg-gold-400 active:bg-gold-600 focus-visible:outline-gold-700",
  secondary:
    "border border-line-strong bg-surface text-ink hover:bg-sunken active:bg-sunken focus-visible:outline-brand-600",
  ghost:
    "text-brand-700 hover:bg-brand-50 active:bg-brand-100 focus-visible:outline-brand-600",
  danger:
    "border border-danger-200 bg-surface text-danger-700 hover:bg-danger-50 focus-visible:outline-danger-600",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-xs",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-13 px-5 text-base",
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  suppressHydrationWarning?: boolean;
  children: ReactNode;
}

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = CommonProps & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function classesFor(
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean,
  className?: string,
): string {
  return [
    BASE,
    VARIANTS[variant],
    SIZES[size],
    fullWidth ? "w-full" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

export default function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", fullWidth = false, children } = props;
  const className = classesFor(variant, size, fullWidth, props.className);

  if (props.href !== undefined) {
    return (
      <Link href={props.href} className={className}>
        {children}
      </Link>
    );
  }

  const rest = { ...props };
  delete rest.variant;
  delete rest.size;
  delete rest.fullWidth;
  delete rest.className;

  return (
    <button type="button" {...rest} className={className}>
      {children}
    </button>
  );
}
