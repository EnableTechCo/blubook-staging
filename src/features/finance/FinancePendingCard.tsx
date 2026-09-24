import { WorkspaceHeader } from "@/components/ui/Workspace";

export function FinancePendingCard() {
  return (
    <section className="workspace-panel" aria-labelledby="finance-pending-title">
      <div className="workspace-panel-header flex items-start gap-4">
        <span aria-hidden="true" className="mt-1 grid size-9 shrink-0 place-items-center border border-cobalt/20 bg-cobalt-wash text-cobalt">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M7 9h10M7 13h5" />
          </svg>
        </span>
        <div>
          <p className="workspace-eyebrow">Finance access</p>
          <h2 id="finance-pending-title" className="workspace-panel-title mt-2">Finance services pending</h2>
          <p className="workspace-panel-subtitle mt-2 max-w-2xl">
            Your BluBook workspace is active. Finance and accounting tools will appear here after your finance partner completes the separate onboarding.
          </p>
        </div>
      </div>
    </section>
  );
}
