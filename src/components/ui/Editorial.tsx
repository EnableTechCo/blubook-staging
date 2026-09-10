import type { ReactNode } from "react";

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

