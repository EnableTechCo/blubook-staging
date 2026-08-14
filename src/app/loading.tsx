import { ThreeLogoLoader } from "@/components/ui/ThreeLogoLoader";

export default function Loading() {
  return (
    <main className="app-loading" aria-live="polite" aria-busy="true">
      <div className="app-loading__atmosphere" aria-hidden="true" />
      <div className="app-loading__content">
        <ThreeLogoLoader />
        <p className="app-loading__label">Preparing your workspace</p>
        <span className="sr-only">Loading…</span>
      </div>
    </main>
  );
}
