import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "light" | "quiet";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-ink bg-ink text-paper-light hover:border-cobalt hover:bg-cobalt disabled:border-ink/40 disabled:bg-ink/40",
  secondary:
    "border-ink/45 bg-transparent text-ink hover:border-cobalt hover:bg-cobalt-wash disabled:border-ink/20 disabled:text-ink/40",
  light:
    "border-paper-light bg-paper-light text-ink hover:border-sun-light hover:bg-sun-light disabled:border-white/40 disabled:bg-white/40",
  quiet:
    "border-transparent bg-transparent text-ink hover:border-ink/30 hover:bg-paper disabled:text-ink/40",
};

export function buttonStyles({
  variant = "primary",
  fullWidth = false,
}: {
  variant?: ButtonVariant;
  fullWidth?: boolean;
} = {}) {
  return [
    "inline-flex min-h-11 items-center justify-center gap-3 border px-5 font-body text-xs font-semibold leading-none tracking-[0.01em] transition-colors",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun",
    "disabled:cursor-not-allowed",
    variants[variant],
    fullWidth ? "w-full" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant = "primary",
  fullWidth = false,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}) {
  return (
    <button
      {...props}
      className={`${buttonStyles({ variant, fullWidth })} ${className}`.trim()}
    />
  );
}
