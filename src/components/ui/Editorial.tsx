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
    <header className="workspace-page-header">
      <div>
        <p className="workspace-eyebrow">{eyebrow}</p>
        <h1 className="workspace-page-title">{title}</h1>
        {description ? (
          <p className="workspace-page-description">{description}</p>
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
    <section className={`workspace-panel ${className}`.trim()}>
      {children}
    </section>
  );
}
