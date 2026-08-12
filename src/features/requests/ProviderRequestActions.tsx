import type { RequestRow } from "@/services/dashboard";
import {
  acceptOffer,
  rejectOffer,
  setRequestStatus,
} from "@/features/requests/actions";

const actionButton =
  "inline-flex min-h-10 items-center justify-center border px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors";

export function ProviderRequestActions({ request }: { request: RequestRow }) {
  const offer = request.request_assignments?.find(
    (assignment) => assignment.status === "offered",
  );

  if (request.status === "open" && offer) {
    return (
      <div className="flex min-w-max flex-wrap gap-2">
        <form action={acceptOffer}>
          <input type="hidden" name="assignmentId" value={offer.id} />
          <input type="hidden" name="requestId" value={request.id} />
          <button
            type="submit"
            aria-label={`Accept request ${request.reference}`}
            className={`${actionButton} border-teal bg-teal text-paper hover:bg-ink`}
          >
            Accept
          </button>
        </form>
        <form action={rejectOffer}>
          <input type="hidden" name="assignmentId" value={offer.id} />
          <input type="hidden" name="requestId" value={request.id} />
          <button
            type="submit"
            aria-label={`Reject request ${request.reference}`}
            className={`${actionButton} border-ink/45 bg-transparent text-ink hover:border-clay hover:bg-clay hover:text-paper`}
          >
            Reject
          </button>
        </form>
      </div>
    );
  }

  // An accepted request sits at 'assigned' until the partner starts the work.
  const started = request.status === "in_progress";
  const isDocumentTransaction =
    request.request_type === "sales_order" || request.request_type === "tender_submission";
  const primaryLabel = started
    ? isDocumentTransaction
      ? "Approve & complete"
      : "Complete"
    : isDocumentTransaction
      ? "Start review"
      : "Start work";
  const requiresInvoice =
    started && request.request_type === "sales_order" && Boolean(request.sales_opportunity_id);
  if (!started && request.status !== "assigned") {
    return (
      <span className="font-mono text-xs text-ink/35" aria-label="No actions available">
        —
      </span>
    );
  }

  return (
    <div className="flex min-w-max flex-wrap gap-2">
      {!requiresInvoice ? <form action={setRequestStatus}>
        <input type="hidden" name="requestId" value={request.id} />
        <input type="hidden" name="status" value={started ? "completed" : "in_progress"} />
        <button
          type="submit"
          aria-label={`${primaryLabel} request ${request.reference}`}
          className={`${actionButton} border-teal bg-teal text-paper hover:bg-ink`}
        >
          {primaryLabel}
        </button>
      </form> : null}
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
