// The dashboard's navigation feedback.
//
// Every page under /dashboard is dynamic, and until this file existed the
// segment had no loading boundary: a click on a card did nothing visible until
// the whole page came back from the server, and the router had nothing it
// could prefetch. With a boundary here the shell stays put, the main area
// swaps to this the moment a link is clicked, and the router prefetches it on
// hover so the swap is instant.
//
// Deliberately generic — a heading, a line of copy, a grid of cards — because
// it stands in for every dashboard page, not one of them.
export default function DashboardLoading() {
  return (
    <div
      className="mx-auto max-w-5xl space-y-8 motion-safe:animate-pulse"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="space-y-3">
        <div className="h-2.5 w-16 rounded-sm bg-ink/[0.08]" />
        <div className="h-7 w-56 rounded-sm bg-ink/[0.1]" />
        <div className="h-3.5 w-full max-w-xl rounded-sm bg-ink/[0.06]" />
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <li key={index} className="workspace-action-card min-h-64 p-5 sm:p-6">
            <div className="h-2.5 w-6 rounded-sm bg-ink/[0.08]" />
            <div className="mt-5 h-5 w-3/4 rounded-sm bg-ink/[0.1]" />
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full rounded-sm bg-ink/[0.06]" />
              <div className="h-3 w-5/6 rounded-sm bg-ink/[0.06]" />
            </div>
          </li>
        ))}
      </ul>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
