import { z } from "zod";
import { customerDetailsSchema } from "@/lib/validation/customers";

// Package assembly: a standard package as the base, and any added line item
// switches the assembly to Flex (priced by individual line-item prices).
const packageAssembly = z
  .object({
    packageMode: z.enum(["standard", "flex"]),
    packageId: z.string().uuid("Select a package"),
    lineItemIds: z.array(z.string().uuid()).default([]),
  })
  .refine((v) => v.packageMode === "standard" || v.lineItemIds.length > 0, {
    message: "A flex package needs at least one line item",
    path: ["lineItemIds"],
  });

export const onboardClientSchema = z.intersection(
  customerDetailsSchema,
  packageAssembly,
);

export type OnboardClientInput = z.infer<typeof onboardClientSchema>;

// Staff accepts or rejects a received checklist document. Every outcome is
// accompanied by a customer-facing message; rejection copy is used as the
// reason shown beside the replacement upload.
export const complianceReviewSchema = z.object({
  documentId: z.string().uuid(),
  decision: z.enum(["verified", "rejected"]),
  message: z.string().trim().min(3, "Add a message for the customer").max(1000),
});

const optionalReviewField = (max: number) =>
  z.string().trim().max(max).transform((value) => value || null);

export const salesProfileReviewSchema = z.object({
  onboardingId: z.string().uuid(),
  expectedProfileVersion: z.coerce.number().int().positive(),
  reviewAction: z.enum(["save", "changes_requested", "approved"]),
  note: z.string().trim().max(1000).default(""),
  business_name: z.string().trim().min(1).max(200),
  registered_name: z.string().trim().min(1).max(200),
  trading_name: z.string().trim().min(1).max(200),
  entity_type: z.union([z.enum([
    "private_company", "public_company", "personal_liability_company", "non_profit_company",
    "state_owned_company", "close_corporation", "cooperative", "trust", "sole_proprietor",
    "partnership", "other",
  ]), z.literal("")]).default(""),
  registration_number: optionalReviewField(80),
  industry: optionalReviewField(120),
  vat_status: z.union([z.enum(["registered", "not_registered", "pending"]), z.literal("")]).default(""),
  vat_number: optionalReviewField(10),
  primary_contact_job_title: optionalReviewField(120),
  primary_contact_phone: optionalReviewField(30),
  billing_contact_name: optionalReviewField(120),
  billing_contact_email: z.union([z.string().trim().email().max(254), z.literal("")]).default(""),
  business_address_line_1: optionalReviewField(200),
  business_address_line_2: optionalReviewField(200),
  business_city: optionalReviewField(100),
  business_province: optionalReviewField(100),
  business_postal_code: optionalReviewField(4),
  business_country: optionalReviewField(100),
  billing_address_line_1: optionalReviewField(200),
  billing_address_line_2: optionalReviewField(200),
  billing_city: optionalReviewField(100),
  billing_province: optionalReviewField(100),
  billing_postal_code: optionalReviewField(4),
  billing_country: optionalReviewField(100),
}).superRefine((value, context) => {
  if (value.vat_status === "registered" && !/^\d{10}$/.test(value.vat_number ?? "")) {
    context.addIssue({ code: "custom", path: ["vat_number"], message: "Enter the 10-digit VAT number" });
  }
  if (value.reviewAction === "changes_requested" && value.note.length < 3) {
    context.addIssue({ code: "custom", path: ["note"], message: "Add a message explaining what the customer needs to update" });
  }
});
