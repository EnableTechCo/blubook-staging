import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "light" | "quiet";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-cobalt bg-cobalt text-white shadow-[0_8px_18px_rgba(45,93,180,0.16)] hover:border-cobalt-deep hover:bg-cobalt-deep disabled:border-cobalt/35 disabled:bg-cobalt/35 disabled:shadow-none",
  secondary:
    "border-ink/15 bg-paper-light/85 text-ink shadow-sm hover:border-cobalt/30 hover:bg-cobalt-wash disabled:border-ink/10 disabled:text-ink/40 disabled:shadow-none",
  light:
    "border-white/80 bg-paper-light/90 text-ink shadow-sm hover:border-cobalt/20 hover:bg-cobalt-wash disabled:border-white/40 disabled:bg-white/40 disabled:shadow-none",
  quiet:
    "border-transparent bg-transparent text-ink hover:border-ink/10 hover:bg-cobalt-wash disabled:text-ink/40",
};

export function buttonStyles({
  variant = "primary",
  fullWidth = false,
}: {
  variant?: ButtonVariant;
  fullWidth?: boolean;
} = {}) {
  return [
    "inline-flex min-h-11 items-center justify-center gap-2.5 rounded-xl border px-5 font-body text-xs font-semibold leading-none tracking-[0.01em] transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98]",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun",
    "disabled:cursor-not-allowed disabled:active:scale-100",
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
