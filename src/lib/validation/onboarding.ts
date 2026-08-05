import { z } from "zod";

export const CLIENT_ENTITY_TYPES = [
  "private_company",
  "public_company",
  "personal_liability_company",
  "non_profit_company",
  "state_owned_company",
  "close_corporation",
  "cooperative",
  "trust",
  "sole_proprietor",
  "partnership",
  "other",
] as const;

export const VAT_STATUSES = ["registered", "not_registered", "pending"] as const;

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

export const customerDetailsSchema = z
  .object({
    registeredName: z.string().trim().min(1, "Registered company name is required").max(200),
    tradingName: z.string().trim().min(1, "Trading name is required").max(200),
    entityType: z.enum(CLIENT_ENTITY_TYPES),
    registrationNumber: z.string().trim().max(80).optional(),
    industry: z.string().trim().min(1, "Industry is required").max(120),
    fullName: z.string().trim().min(1, "Primary contact name is required").max(120),
    jobTitle: z.string().trim().min(1, "Primary contact job title is required").max(120),
    email: z.string().email("Enter a valid primary contact email address"),
    telephone: z.string().trim().min(7, "Enter a valid telephone number").max(30),
    billingContactName: z.string().trim().min(1, "Billing contact name is required").max(120),
    billingContactEmail: z.string().email("Enter a valid billing contact email address"),
    businessAddressLine1: z.string().trim().min(1, "Business address is required").max(200),
    businessAddressLine2: z.string().trim().max(200).optional(),
    businessCity: z.string().trim().min(1, "Business city is required").max(100),
    businessProvince: z.string().trim().min(1, "Business province is required").max(100),
    businessPostalCode: z.string().trim().regex(/^\d{4}$/, "Enter a 4-digit business postal code"),
    businessCountry: z.string().trim().min(1).max(100),
    billingAddressLine1: z.string().trim().min(1, "Billing address is required").max(200),
    billingAddressLine2: z.string().trim().max(200).optional(),
    billingCity: z.string().trim().min(1, "Billing city is required").max(100),
    billingProvince: z.string().trim().min(1, "Billing province is required").max(100),
    billingPostalCode: z.string().trim().regex(/^\d{4}$/, "Enter a 4-digit billing postal code"),
    billingCountry: z.string().trim().min(1).max(100),
    vatStatus: z.enum(VAT_STATUSES),
    vatNumber: z.string().trim().optional(),
  })
  .superRefine((value, context) => {
    if (
      !["sole_proprietor", "partnership"].includes(value.entityType) &&
      !value.registrationNumber
    ) {
      context.addIssue({
        code: "custom",
        path: ["registrationNumber"],
        message: "Registration or entity reference number is required",
      });
    }
    if (value.vatStatus === "registered" && !/^\d{10}$/.test(value.vatNumber ?? "")) {
      context.addIssue({
        code: "custom",
        path: ["vatNumber"],
        message: "Enter the 10-digit VAT number",
      });
    }
  });

export const onboardClientSchema = z.intersection(
  customerDetailsSchema,
  z.intersection(
    z.object({
      tempPassword: z.string().min(8, "Temporary password must be at least 8 characters"),
    }),
    packageAssembly,
  ),
);

export const updateCustomerDetailsSchema = z.intersection(
  z.object({ clientId: z.string().uuid() }),
  customerDetailsSchema,
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
