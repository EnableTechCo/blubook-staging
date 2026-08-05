"use client";

import { useActionState } from "react";
import { Button, buttonStyles } from "@/components/ui/Button";
import { fieldStyles, labelStyles } from "@/components/ui/formStyles";
import {
  reviewComplianceDocument,
  type ComplianceReviewState,
} from "@/features/onboarding/actions";

export function ComplianceReviewForm({
  documentId,
  documentName,
  fileId,
  fileTitle,
}: {
  documentId: string;
  documentName: string;
  fileId: string;
  fileTitle: string;
}) {
  const [state, action, pending] = useActionState<ComplianceReviewState, FormData>(
    reviewComplianceDocument,
    undefined,
  );

  return (
    <form action={action} className="min-w-0 space-y-3 border-l-[3px] border-cobalt bg-cream/45 p-4">
      <input type="hidden" name="documentId" value={documentId} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/25 pb-3">
        <div>
          <p className="text-xs font-semibold text-ink">Review submitted document</p>
          <p className="mt-1 max-w-md truncate text-xs text-ink/55">{fileTitle}</p>
        </div>
        <a
          href={`/api/documents/${fileId}`}
          target="_blank"
          rel="noreferrer"
          className={buttonStyles({ variant: "secondary" })}
        >
          Open document <span aria-hidden="true">↗</span>
        </a>
      </div>
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
