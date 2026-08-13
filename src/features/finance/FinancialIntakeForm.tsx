"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, fileFieldStyles, helpTextStyles, labelStyles } from "@/components/ui/formStyles";
import { submitFinancials, type FinancialActionState } from "@/features/finance/actions";
import type { SubmissionClient } from "@/features/finance/queries";
import { uploadDocumentDirectly } from "@/features/documents/directUpload";
import { prepareDirectDocumentUpload } from "@/features/documents/directUploadActions";
import { documentPolicyError } from "@/features/documents/uploadPolicy";
import { FINANCIAL_FIELDS } from "@/lib/validation/financials";
import { FISCAL_QUARTERS, FISCAL_WEEKS_PER_QUARTER } from "@/lib/time";

const ACCEPTED_FILES = ".pdf,.docx,.xlsx,.csv,.png,.jpg,.jpeg";

interface StagedEvidence {
  locator: string;
  name: string;
  size: number;
  type: string;
}

export function FinancialIntakeForm({
  client,
  fiscalYear,
  fiscalQuarter,
  fiscalWeek,
}: {
  client: SubmissionClient;
  fiscalYear: number;
  fiscalQuarter: number;
  fiscalWeek: number;
}) {
  const [state, action, pending] = useActionState<FinancialActionState, FormData>(
    submitFinancials,
    undefined,
  );
  const [evidence, setEvidence] = useState<StagedEvidence | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const failed = state !== undefined && "error" in state;
  const saved = state !== undefined && "ok" in state;

  // The file goes to storage as soon as it is chosen, so the figures are only
  // ever submitted alongside a document that already exists and has been
  // verified. The form carries the locator, never the bytes.
  async function stageEvidence(file: File | undefined) {
    setUploadError(null);
    if (!file || file.size === 0) {
      setEvidence(null);
      return;
    }
    const policyError = documentPolicyError(file);
    if (policyError) {
      setUploadError(`${file.name}: ${policyError}`);
      return;
    }

    setUploading(true);
    try {
      const prepared = await prepareDirectDocumentUpload({
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        financialsClientId: client.id,
      });
      if (!prepared.ok) throw new Error(prepared.error);
      await uploadDocumentDirectly({ file, prepared: prepared.upload });
      setEvidence({
        locator: prepared.upload.locator,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
      });
    } catch (error) {
      setEvidence(null);
      setUploadError(error instanceof Error ? error.message : "The upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={action} aria-busy={pending} className="space-y-8">
      <input type="hidden" name="clientId" value={client.id} />
      {evidence ? (
        <>
          <input type="hidden" name="evidenceLocator" value={evidence.locator} />
          <input type="hidden" name="evidenceName" value={evidence.name} />
          <input type="hidden" name="evidenceSize" value={evidence.size} />
          <input type="hidden" name="evidenceType" value={evidence.type} />
        </>
      ) : null}

      {failed ? (
        <p role="alert" className="border-l-[3px] border-clay bg-clay/10 px-4 py-3 text-[13px] leading-6 text-ink">
          {state.error}
        </p>
      ) : null}
      {saved ? (
        <p className="border-l-[3px] border-teal bg-teal/10 px-4 py-3 text-[13px] leading-6 text-ink">
          Figures recorded for {state.reference}. The document has been filed to the customer&rsquo;s
          archive and kept in your library. Filing the same week again will correct it.
        </p>
      ) : null}

      <div className="grid gap-5 rounded-2xl border border-ink/10 bg-paper-light/75 p-5 shadow-surface sm:grid-cols-3">
        <div>
          <label htmlFor="fiscalYear" className={labelStyles}>
            Fiscal year
          </label>
          <input
            id="fiscalYear"
            name="fiscalYear"
            type="number"
            required
            defaultValue={fiscalYear}
            className={fieldStyles}
          />
        </div>
        <div>
          <label htmlFor="fiscalQuarter" className={labelStyles}>
            Quarter
          </label>
          <select id="fiscalQuarter" name="fiscalQuarter" defaultValue={fiscalQuarter} className={fieldStyles}>
            {Array.from({ length: FISCAL_QUARTERS }, (_, index) => index + 1).map((quarter) => (
              <option key={quarter} value={quarter}>
                Q{quarter}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="fiscalWeek" className={labelStyles}>
            Week
          </label>
          <select id="fiscalWeek" name="fiscalWeek" defaultValue={fiscalWeek} className={fieldStyles}>
            {Array.from({ length: FISCAL_WEEKS_PER_QUARTER }, (_, index) => index + 1).map((week) => (
              <option key={week} value={week}>
                {week}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-ink/10 bg-paper-light/75 shadow-surface">
        <div className="border-b border-ink/8 px-5 py-4">
          <h2 className="font-heading text-[1.35rem] leading-none text-ink">Supporting document</h2>
          <p className="mt-2 text-xs leading-5 text-ink/55">
            Required. Filed to this customer&rsquo;s document archive, with a copy kept in your own
            library.
          </p>
        </div>
        <div className="p-5">
          <label htmlFor="evidence" className={labelStyles}>
            Evidence for these figures
          </label>
          <input
            id="evidence"
            type="file"
            accept={ACCEPTED_FILES}
            className={fileFieldStyles}
            onChange={(event) => void stageEvidence(event.target.files?.[0])}
          />
          <p className={helpTextStyles} role="status">
            {uploading
              ? "Uploading…"
              : evidence
                ? `${evidence.name} attached.`
                : "Attach the statement or report these figures come from."}
          </p>
          {uploadError ? (
            <p role="alert" className="mt-2 text-[12px] leading-5 text-clay">
              {uploadError}
            </p>
          ) : null}
        </div>
      </section>

      {/* Grouped by the ratio each set feeds, with the formula stated, so the
          partner can see what a figure is for rather than filling a blank. */}
      {FINANCIAL_FIELDS.map((group) => (
        <section key={group.group} className="overflow-hidden rounded-2xl border border-ink/10 bg-paper-light/75 shadow-surface">
          <div className="border-b border-ink/8 px-5 py-4">
            <h2 className="font-heading text-[1.35rem] leading-none text-ink">{group.group}</h2>
            <p className="mt-2 text-xs leading-5 text-ink/55">{group.formula}</p>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
            {group.fields.map((field) => (
              <div key={field.name}>
                <label htmlFor={field.name} className={labelStyles}>
                  {field.label}
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  type="number"
                  step={"integer" in field && field.integer ? "1" : "0.01"}
                  inputMode="decimal"
                  placeholder="0"
                  className={fieldStyles}
                />
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending || uploading || evidence === null}>
          {pending ? "Recording…" : "Record figures"}
        </Button>
        <p className="text-xs leading-5 text-ink/55">
          {evidence === null
            ? "Attach the supporting document to continue."
            : "A blank field is recorded as zero. Re-filing a week replaces it."}
        </p>
      </div>
    </form>
  );
}
