import type { TransactionKind } from "@/features/transact/kinds";
import {
  MAX_DOCUMENTS_PER_SUBMISSION,
  documentPolicyError,
  type UploadedDocumentInput,
} from "@/features/documents/uploadPolicy";
import type { PreparedDocumentUpload } from "@/lib/storage/documents";
import type { SubmitTransactionResult } from "@/features/transact/submissionSchema";

/**
 * The submission form's orchestration, with its collaborators as parameters.
 *
 * This was submit() inside TransactionSubmissionForm: validate the files,
 * prepare and upload each with progress, build the payload for the kind, call
 * the action, navigate. It ran through a React 19 <form action={fn}>, which
 * this suite's jsdom cannot drive, so none of it was testable in place — the
 * prepare-then-upload ordering, the per-kind payload shapes, which error wins.
 *
 * Same move as onboardClientSteps: the component keeps its state and its
 * router; the decisions live here and take a fake as easily as the real thing.
 */

export interface SubmitDeps {
  prepare: (file: { name: string; size: number; type: string }) =>
    Promise<{ ok: true; upload: PreparedDocumentUpload } | { ok: false; error: string }>;
  upload: (args: {
    file: File;
    prepared: PreparedDocumentUpload;
    onProgress: (percentage: number) => void;
  }) => Promise<UploadedDocumentInput>;
  submitTransaction: (input: unknown) => Promise<SubmitTransactionResult>;
  /** Called with the file's index and 0–100 as each upload advances. */
  onProgress: (index: number, percentage: number) => void;
}

export interface SubmitContext {
  kind: TransactionKind;
  /** When set, the sales order is bound to this opportunity regardless of the form's mode. */
  lockedOpportunityId?: string;
  opportunityMode: "existing" | "new";
}

type SubmitOutcome =
  | { ok: true; reference: string }
  | { ok: false; error: string; stage: "validation" | "prepare" | "upload" | "submit" };

// ---------------------------------------------------------------------------
// 1. The files, checked before anything is sent anywhere
// ---------------------------------------------------------------------------

export function collectFiles(formData: FormData): { files: File[] } | { error: string } {
  const files = formData
    .getAll("documents")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) return { error: "Attach at least one document." };
  if (files.length > MAX_DOCUMENTS_PER_SUBMISSION) {
    return { error: `Attach no more than ${MAX_DOCUMENTS_PER_SUBMISSION} documents.` };
  }
  for (const file of files) {
    const policyError = documentPolicyError(file);
    if (policyError) return { error: `${file.name}: ${policyError}` };
  }
  return { files };
}

// ---------------------------------------------------------------------------
// 2. The payload for the kind
// ---------------------------------------------------------------------------

export function buildSubmission(
  formData: FormData,
  ctx: SubmitContext,
  uploaded: UploadedDocumentInput[],
): Record<string, unknown> {
  const { kind } = ctx;

  if (kind === "purchase_order") {
    return {
      kind,
      amount: formData.get("amount"),
      currency: "ZAR",
      description: formData.get("description"),
      files: uploaded,
      notes: formData.get("notes"),
      purchaseOrderNumber: formData.get("purchaseOrderNumber"),
      requiredDate: formData.get("requiredDate"),
      supplier: formData.get("supplier"),
    };
  }

  if (kind === "sales_order") {
    return {
      kind,
      amount: formData.get("amount"),
      currency: "ZAR",
      description: formData.get("description"),
      files: uploaded,
      notes: formData.get("notes"),
      salesOrderNumber: formData.get("salesOrderNumber"),
      requiredDate: formData.get("requiredDate"),
      supplier: formData.get("supplier"),
      // A locked opportunity wins over whatever the form's radio says.
      opportunityId:
        ctx.lockedOpportunityId ??
        (ctx.opportunityMode === "existing" ? formData.get("opportunityId") : undefined),
      newOpportunity:
        ctx.opportunityMode === "new" && !ctx.lockedOpportunityId
          ? {
              opportunitySource: formData.get("opportunitySource"),
              opportunityName: formData.get("opportunityName"),
              forecastCategory: formData.get("forecastCategory"),
              revenue: formData.get("revenue"),
              fiscalYear: String(formData.get("fiscalYear") ?? ""),
              fiscalQuarter: String(formData.get("fiscalQuarter") ?? ""),
              fiscalWeek: String(formData.get("fiscalWeek") ?? ""),
            }
          : undefined,
    };
  }

  // tender_submission, rffa, rfq share one shape
  return {
    kind,
    closingAt: formData.get("closingAt"),
    files: uploaded,
    issuer: formData.get("issuer"),
    notes: formData.get("notes"),
    tenderReference: formData.get("tenderReference"),
    tenderTitle: formData.get("tenderTitle"),
  };
}

// ---------------------------------------------------------------------------
// 3. The whole thing, in order
// ---------------------------------------------------------------------------

export async function submitTransactionForm(
  formData: FormData,
  ctx: SubmitContext,
  deps: SubmitDeps,
): Promise<SubmitOutcome> {
  const collected = collectFiles(formData);
  if ("error" in collected) return { ok: false, error: collected.error, stage: "validation" };

  const uploaded: UploadedDocumentInput[] = [];
  for (let index = 0; index < collected.files.length; index += 1) {
    const file = collected.files[index];

    const prepared = await deps.prepare({ name: file.name, size: file.size, type: file.type });
    if (!prepared.ok) return { ok: false, error: prepared.error, stage: "prepare" };

    try {
      uploaded.push(
        await deps.upload({
          file,
          prepared: prepared.upload,
          onProgress: (percentage) => deps.onProgress(index, percentage),
        }),
      );
    } catch (uploadError) {
      return {
        ok: false,
        error: uploadError instanceof Error ? uploadError.message : "The upload failed.",
        stage: "upload",
      };
    }
  }

  const result = await deps.submitTransaction(buildSubmission(formData, ctx, uploaded));
  if (!result.ok) return { ok: false, error: result.error, stage: "submit" };
  return { ok: true, reference: result.reference };
}
