"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, labelStyles } from "@/components/ui/formStyles";
import {
  reviewComplianceDocument,
  type ComplianceReviewState,
} from "@/features/onboarding/actions";

export function ComplianceReviewForm({
  documentId,
  documentName,
}: {
  documentId: string;
  documentName: string;
}) {
  const [state, action, pending] = useActionState<ComplianceReviewState, FormData>(
    reviewComplianceDocument,
    undefined,
  );

  return (
    <form action={action} className="min-w-0 space-y-3 border-l-[3px] border-cobalt bg-cream/45 p-4">
      <input type="hidden" name="documentId" value={documentId} />
      <div>
        <label htmlFor={`review-message-${documentId}`} className={labelStyles}>
          Message to customer
        </label>
        <textarea
          id={`review-message-${documentId}`}
          name="message"
          required
          minLength={3}
          maxLength={1000}
          rows={3}
          placeholder={`Explain why ${documentName} is accepted or what must be corrected.`}
          className={`${fieldStyles} resize-y`}
        />
      </div>
      {state && "error" in state ? (
        <p role="alert" className="text-xs leading-5 text-clay">
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="decision" value="verified" disabled={pending}>
          Accept document
        </Button>
        <Button
          type="submit"
          name="decision"
          value="rejected"
          variant="secondary"
          disabled={pending}
        >
          Reject document
        </Button>
      </div>
    </form>
  );
}
