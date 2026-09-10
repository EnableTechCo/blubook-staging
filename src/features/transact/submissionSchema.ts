import { z } from "zod";
import { KIND_LABEL } from "@/features/transact/kinds";
import {
  MAX_DOCUMENTS_PER_SUBMISSION,
  type UploadedDocumentInput,
} from "@/features/documents/uploadPolicy";

/**
 * What a transaction submission looks like, and how it reads as a request.
 *
 * Moved out of submissionActions.ts because that file is "use server", which
 * may only export async functions — so its schema and its pure summary()
 * were module-private and, with them, untestable. The action imports both
 * from here and keeps only the work that touches the database.
 */

const uploadedDocumentSchema = z.object({
  locator: z.string().trim().min(1).max(1000),
  title: z.string().trim().min(1).max(240),
  mimeType: z.string().trim().min(1).max(160),
  sizeBytes: z.number().int().positive(),
}) satisfies z.ZodType<UploadedDocumentInput>;

const attachments = z
  .array(uploadedDocumentSchema)
  .min(1, "Attach at least one document.")
  .max(MAX_DOCUMENTS_PER_SUBMISSION);

const salesOrderSchema = z.object({
  kind: z.literal("sales_order"),
  amount: z.string().trim().max(80).optional(),
  currency: z.string().trim().min(3).max(3).default("ZAR"),
  description: z.string().trim().min(1, "Describe the purchase.").max(2000),
  files: attachments,
  notes: z.string().trim().max(2000).optional(),
  salesOrderNumber: z.string().trim().min(1, "Enter the sales order number.").max(120),
  requiredDate: z.string().trim().max(40).optional(),
  supplier: z.string().trim().min(1, "Enter the supplier or recipient.").max(200),
  opportunityId: z.string().uuid().optional(),
  newOpportunity: z
    .object({
      opportunitySource: z.string().trim().min(1).max(80),
      opportunityName: z.string().trim().min(1).max(240),
      forecastCategory: z.string().trim().min(1).max(80),
      revenue: z.coerce.number().min(0).max(999999999999.99),
      fiscalYear: z.coerce.number().int().min(2000).max(2200).optional().or(z.literal("")),
      fiscalQuarter: z.coerce.number().int().min(1).max(4).optional().or(z.literal("")),
      fiscalWeek: z.coerce.number().int().min(1).max(13).optional().or(z.literal("")),
    })
    .optional(),
});

// A purchase order is spend the business is committing to. It carries the same
// commercial details as the sales order it was mistaken for, minus everything
// that belongs to revenue: no opportunity to link, no invoice to come back, no
// booking at the end.
const purchaseOrderSchema = z.object({
  kind: z.literal("purchase_order"),
  purchaseOrderNumber: z.string().trim().min(1, "Enter the purchase order number.").max(120),
  supplier: z.string().trim().min(1, "Enter the supplier.").max(200),
  amount: z.string().trim().max(80).optional(),
  currency: z.string().trim().min(3).max(3).default("ZAR"),
  requiredDate: z.string().trim().max(40).optional(),
  description: z.string().trim().min(1, "Describe what is being purchased.").max(2000),
  notes: z.string().trim().max(2000).optional(),
  files: attachments,
});

const tenderSchema = z.object({
  kind: z.literal("tender_submission"),
  closingAt: z.string().trim().max(80).optional(),
  files: attachments,
  issuer: z.string().trim().min(1, "Enter the issuing organisation.").max(200),
  notes: z.string().trim().max(2000).optional(),
  tenderReference: z.string().trim().min(1, "Enter the tender reference.").max(120),
  tenderTitle: z.string().trim().min(1, "Enter the tender title.").max(240),
});

// RFFA and RFQ are tender-family documents, so they carry the same details as
// a tender submission and are delivered by the same work group.
const tenderFamilyShape = {
  closingAt: z.string().trim().max(80).optional(),
  files: attachments,
  issuer: z.string().trim().min(1, "Enter the issuing organisation.").max(200),
  notes: z.string().trim().max(2000).optional(),
  tenderReference: z.string().trim().min(1, "Enter the reference.").max(120),
  tenderTitle: z.string().trim().min(1, "Enter the title.").max(240),
};

const rffaSchema = z.object({ kind: z.literal("rffa"), ...tenderFamilyShape });
const rfqSchema = z.object({ kind: z.literal("rfq"), ...tenderFamilyShape });

export const submissionSchema = z.discriminatedUnion("kind", [
  salesOrderSchema,
  purchaseOrderSchema,
  tenderSchema,
  rffaSchema,
  rfqSchema,
]);

type SubmissionInput = z.infer<typeof submissionSchema>;

export type SubmitTransactionResult =
  | { ok: true; reference: string; requestId: string }
  | { ok: false; error: string };

/** The request title and description a submission becomes. */
export function summary(input: SubmissionInput): { description: string; title: string } {
  if (input.kind === "sales_order") {
    return {
      title: `Sales order ${input.salesOrderNumber}`,
      description: [
        `Sales order: ${input.salesOrderNumber}`,
        `Supplier or recipient: ${input.supplier}`,
        input.amount ? `Amount: ${input.currency.toUpperCase()} ${input.amount}` : null,
        input.requiredDate ? `Required date: ${input.requiredDate}` : null,
        "",
        input.description,
        input.notes ? `\nNotes:\n${input.notes}` : null,
      ]
        .filter((line) => line !== null)
        .join("\n"),
    };
  }

  if (input.kind === "purchase_order") {
    return {
      title: `Purchase order ${input.purchaseOrderNumber}`,
      description: [
        `Purchase order: ${input.purchaseOrderNumber}`,
        `Supplier: ${input.supplier}`,
        input.amount ? `Amount: ${input.currency.toUpperCase()} ${input.amount}` : null,
        input.requiredDate ? `Required date: ${input.requiredDate}` : null,
        "",
        input.description,
        input.notes ? `\nNotes:\n${input.notes}` : null,
      ]
        .filter((line) => line !== null)
        .join("\n"),
    };
  }

  const label = KIND_LABEL[input.kind];
  return {
    title: `${input.tenderReference} · ${input.tenderTitle}`,
    description: [
      `${label} reference: ${input.tenderReference}`,
      `Issuing organisation: ${input.issuer}`,
      input.closingAt ? `Closing date and time: ${input.closingAt}` : null,
      "",
      input.notes || "No additional notes supplied.",
    ]
      .filter((line) => line !== null)
      .join("\n"),
  };
}
