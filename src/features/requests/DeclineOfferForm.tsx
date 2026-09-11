import { rejectOffer } from "@/features/requests/actions";
import { fieldStyles, labelStyles } from "@/components/ui/formStyles";

const actionButton =
  "inline-flex min-h-10 items-center justify-center border px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors";

/**
 * Declining an offer, with the reason it asks for.
 *
 * A plain <details>: the Decline button opens a short form beneath the offer
 * rather than a dialog, so the partner reads what they are declining while
 * they say why. The reason is required here and checked again in the action.
 * Works without client JavaScript, which is why it is not a dialog.
 */
export function DeclineOfferForm({
  assignmentId,
  requestId,
  reference,
  tone = "light",
}: {
  assignmentId: string;
  requestId?: string;
  /** The request reference, for the accessible names. */
  reference: string;
  /** The offer list sits on a tinted row; the request page on paper. */
  tone?: "light" | "paper";
}) {
  const reasonId = `decline-reason-${assignmentId}`;
  return (
    <details className="group">
      <summary
        aria-label={`Decline offer ${reference}`}
        className={`${actionButton} cursor-pointer list-none border-ink/45 text-ink hover:border-ink hover:bg-ink hover:text-paper group-open:border-ink group-open:bg-ink group-open:text-paper [&::-webkit-details-marker]:hidden ${
          tone === "paper" ? "bg-transparent" : "bg-paper-light"
        }`}
      >
        Decline
      </summary>
      <form
        action={rejectOffer}
        className="mt-3 w-full min-w-64 max-w-md space-y-3 border border-ink/20 bg-paper p-4 text-left sm:min-w-80"
      >
        <input type="hidden" name="assignmentId" value={assignmentId} />
        {requestId ? <input type="hidden" name="requestId" value={requestId} /> : null}
        <div>
          <label htmlFor={reasonId} className={labelStyles}>
            Why are you declining?
          </label>
          <textarea
            id={reasonId}
            name="reason"
            required
            minLength={3}
            maxLength={500}
            rows={3}
            placeholder="e.g. No capacity until next month, or outside the sectors we serve."
            className={`${fieldStyles} min-h-20 resize-y py-2.5`}
          />
          <p className="mt-2 text-xs leading-5 text-ink/60">
            BluBook operations sees this. The request is offered to the next partner straight away.
          </p>
        </div>
        <button
          type="submit"
          aria-label={`Confirm decline of offer ${reference}`}
          className={`${actionButton} border-clay bg-clay text-paper hover:border-ink hover:bg-ink`}
        >
          Decline offer
        </button>
      </form>
    </details>
  );
}
