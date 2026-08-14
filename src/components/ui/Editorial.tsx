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
      className={`flex items-center gap-3 font-body text-[11px] font-medium uppercase tracking-[0.18em] ${
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
    <header className="grid gap-6 border-b border-ink/10 pb-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-4 max-w-4xl font-heading text-[clamp(2.25rem,4vw,3.25rem)] font-normal leading-[0.98] tracking-[-0.035em] text-ink">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/60">{description}</p>
        ) : null}
      </div>
      {action ? <div className="lg:pb-1">{action}</div> : null}
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
    <section className={`overflow-hidden rounded-2xl border border-ink/10 bg-paper-light/80 shadow-surface ${className}`.trim()}>
      {children}
    </section>
  );
}
