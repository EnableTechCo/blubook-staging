import type { RequestRow } from "@/services/dashboard";
import { setRequestStatus } from "@/features/requests/actions";

const actionButton =
  "inline-flex min-h-10 items-center justify-center border px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors";

export function ProviderRequestActions({ request }: { request: RequestRow }) {
  if (request.status !== "in_progress") {
    return (
      <span className="font-mono text-xs text-ink/35" aria-label="No actions available">
        —
      </span>
    );
  }

  return (
    <div className="flex min-w-max flex-wrap gap-2">
      <form action={setRequestStatus}>
        <input type="hidden" name="requestId" value={request.id} />
        <input type="hidden" name="status" value="completed" />
        <button
          type="submit"
          aria-label={`Complete request ${request.reference}`}
          className={`${actionButton} border-teal bg-teal text-paper hover:bg-ink`}
        >
          Complete
        </button>
      </form>
      <form action={setRequestStatus}>
        <input type="hidden" name="requestId" value={request.id} />
        <input type="hidden" name="status" value="cancelled" />
        <button
          type="submit"
          aria-label={`Cancel request ${request.reference}`}
          className={`${actionButton} border-ink/45 bg-transparent text-ink hover:border-clay hover:bg-clay hover:text-paper`}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
