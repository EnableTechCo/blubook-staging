import type { ReactNode } from "react";

export function Eyebrow({
  children,
  inverse = false,
  className = "",
}: {
  children: ReactNode;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <p
      className={`flex items-center gap-3 font-mono text-[9px] font-medium uppercase tracking-[0.2em] ${
        inverse ? "text-paper-light/70" : "text-ink/65"
      } ${className}`.trim()}
    >
      <span className={`h-px w-6 ${inverse ? "bg-paper-light/45" : "bg-ink/35"}`} aria-hidden="true" />
      {children}
    </p>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="grid gap-7 border-b border-ink/25 pb-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-5 max-w-4xl font-heading text-[clamp(2.7rem,5vw,4.8rem)] font-normal leading-[0.92] tracking-[-0.045em] text-ink">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 max-w-2xl text-sm leading-7 text-ink/65">{description}</p>
        ) : null}
      </div>
      {action ? <div className="md:pb-1">{action}</div> : null}
    </header>
  );
}

export function EditorialPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border border-ink/25 bg-paper-light ${className}`.trim()}>
      {children}
    </section>
  );
}
