import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "light" | "quiet";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-cobalt-deep/20 bg-cobalt text-white shadow-[0_2px_5px_-3px_rgba(31,65,115,0.5)] hover:border-cobalt-deep hover:bg-cobalt-deep disabled:border-cobalt/35 disabled:bg-cobalt/35 disabled:shadow-none",
  secondary:
    "border-ink/16 bg-white text-ink shadow-[0_1px_2px_rgba(31,65,115,0.035)] hover:border-cobalt/30 hover:bg-cobalt-wash/55 disabled:border-ink/10 disabled:text-ink/40 disabled:shadow-none",
  light:
    "border-white/80 bg-white text-ink shadow-[0_1px_2px_rgba(31,65,115,0.035)] hover:border-cobalt/24 hover:bg-cobalt-wash/55 disabled:border-white/40 disabled:bg-white/40 disabled:shadow-none",
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
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 font-body text-xs font-semibold leading-none tracking-[0.01em] transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]",
    "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-cobalt/30",
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
