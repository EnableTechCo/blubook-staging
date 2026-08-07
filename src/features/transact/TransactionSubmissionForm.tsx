"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, helpTextStyles, labelStyles } from "@/components/ui/formStyles";
import type { TransactionKind } from "@/features/transact/kinds";
import { prepareDirectDocumentUpload } from "@/features/documents/directUploadActions";
import { uploadDocumentDirectly } from "@/features/documents/directUpload";
import {
  MAX_DOCUMENTS_PER_SUBMISSION,
  documentPolicyError,
  type UploadedDocumentInput,
} from "@/features/documents/uploadPolicy";
import { submitDocumentTransaction } from "@/features/transact/submissionActions";


// RFFA and RFQ carry the same details as a tender, so they share its fields and
// only the wording differs.
const REFERENCE_LABEL: Record<Exclude<TransactionKind, "purchase_order">, string> = {
  tender_submission: "Tender",
  rffa: "RFFA",
  rfq: "RFQ",
};

interface UploadProgress {
  name: string;
  percentage: number;
}

const ACCEPTED_FILES = ".pdf,.docx,.xlsx,.csv,.png,.jpg,.jpeg";

export function TransactionSubmissionForm({ kind }: { kind: TransactionKind }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState<UploadProgress[]>([]);
  const isPurchaseOrder = kind === "purchase_order";
  const documentLabel = isPurchaseOrder ? null : REFERENCE_LABEL[kind];

  async function submit(formData: FormData) {
    setError(null);
    const files = formData
      .getAll("documents")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (files.length === 0) {
      setError("Attach at least one document.");
      return;
    }
    if (files.length > MAX_DOCUMENTS_PER_SUBMISSION) {
      setError(`Attach no more than ${MAX_DOCUMENTS_PER_SUBMISSION} documents.`);
      return;
    }
    for (const file of files) {
      const policyError = documentPolicyError(file);
      if (policyError) {
        setError(`${file.name}: ${policyError}`);
        return;
      }
    }

    setPending(true);
    setProgress(files.map((file) => ({ name: file.name, percentage: 0 })));

    try {
      const uploaded: UploadedDocumentInput[] = [];
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const prepared = await prepareDirectDocumentUpload({
          name: file.name,
          size: file.size,
          type: file.type,
        });
        if (!prepared.ok) throw new Error(prepared.error);

        uploaded.push(
          await uploadDocumentDirectly({
            file,
            prepared: prepared.upload,
            onProgress(percentage) {
              setProgress((current) =>
                current.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, percentage } : item,
                ),
              );
            },
          }),
        );
      }

      const result = await submitDocumentTransaction(
        isPurchaseOrder
          ? {
              kind,
              amount: formData.get("amount"),
              currency: "ZAR",
              description: formData.get("description"),
              files: uploaded,
              notes: formData.get("notes"),
              purchaseOrderNumber: formData.get("purchaseOrderNumber"),
              requiredDate: formData.get("requiredDate"),
              supplier: formData.get("supplier"),
            }
          : {
              kind,
              closingAt: formData.get("closingAt"),
              files: uploaded,
              issuer: formData.get("issuer"),
              notes: formData.get("notes"),
              tenderReference: formData.get("tenderReference"),
              tenderTitle: formData.get("tenderTitle"),
            },
      );
      if (!result.ok) throw new Error(result.error);

      formRef.current?.reset();
      router.push(`/dashboard/transact?submitted=${encodeURIComponent(result.reference)}`);
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "The submission could not be completed.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      ref={formRef}
      action={(formData) => void submit(formData)}
      aria-busy={pending}
      className="space-y-5"
    >
      {isPurchaseOrder ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Purchase order number" name="purchaseOrderNumber" required />
            <Field label="Supplier or recipient" name="supplier" required />
          </div>
          <div>
            <label htmlFor="description" className={labelStyles}>
              Purchase details
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              maxLength={2000}
              required
              placeholder="Describe the goods, quantities, delivery requirements, and any instructions."
              className={`${fieldStyles} min-h-28 resize-y`}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Amount in rand"
              name="amount"
              inputMode="decimal"
              placeholder="Optional"
            />
            <Field label="Required date" name="requiredDate" type="date" />
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`${documentLabel} reference`} name="tenderReference" required />
            <Field label="Issuing organisation" name="issuer" required />
          </div>
          <Field label={`${documentLabel} title`} name="tenderTitle" required />
          <Field label="Closing date and time" name="closingAt" type="datetime-local" />
        </>
      )}

      <div>
        <label htmlFor="notes" className={labelStyles}>
          Additional notes <span className="font-normal text-ink/45">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={2000}
          className={`${fieldStyles} resize-y`}
        />
      </div>

      <div className="border border-ink/45 bg-paper p-4">
        <label htmlFor="documents" className={labelStyles}>
          Supporting documents
        </label>
        <input
          id="documents"
          name="documents"
          type="file"
          accept={ACCEPTED_FILES}
          multiple
          required
          disabled={pending}
          className={`${fieldStyles} file:mr-4 file:border-0 file:bg-ink file:px-4 file:py-2 file:text-xs file:font-semibold file:text-paper-light`}
        />
        <p className={helpTextStyles}>
          Attach up to five PDF, DOCX, XLSX, CSV, PNG or JPEG files, up to 50 MB each.
        </p>
      </div>

      {progress.length > 0 ? (
        <ul aria-label="Upload progress" className="space-y-2">
          {progress.map((item) => (
            <li key={item.name} className="grid grid-cols-[1fr_auto] gap-3 text-xs text-ink/65">
              <span className="truncate">{item.name}</span>
              <span>{item.percentage}%</span>
              <span className="col-span-2 h-1 bg-ink/15">
                <span
                  className="block h-full bg-cobalt transition-[width]"
                  style={{ width: `${item.percentage}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="border-l-[3px] border-clay bg-clay/10 px-4 py-3 text-[13px] leading-6 text-ink"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>
          <span aria-live="polite">
            {pending
              ? "Uploading and submitting…"
              : isPurchaseOrder
                ? "Submit purchase order"
                : "Submit tender"}
          </span>
          {!pending ? <span aria-hidden="true">→</span> : null}
        </Button>
        <Link href="/dashboard/transact" className="text-sm text-ink/55 hover:text-cobalt">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  ...inputProps
}: {
  label: string;
  name: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className={labelStyles}>
        {label}
      </label>
      <input id={name} name={name} maxLength={240} className={fieldStyles} {...inputProps} />
    </div>
  );
}
