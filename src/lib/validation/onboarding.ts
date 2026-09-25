import { z } from "zod";
import { credentialsSchema } from "@/lib/validation/auth";
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

// What an invited client submits: their business details, the password they
// will sign in with, and the package they chose. The password rule is the
// login form's, so the two can never disagree.
export const clientOnboardingSchema = z.intersection(
  customerDetailsSchema,
  z.intersection(credentialsSchema.pick({ password: true }), packageAssembly),
);

export type ClientOnboardingInput = z.infer<typeof clientOnboardingSchema>;

// Staff accepts or rejects a received checklist document. Every outcome is
// accompanied by a customer-facing message; rejection copy is used as the
// reason shown beside the replacement upload.
export const complianceReviewSchema = z.object({
  documentId: z.string().uuid(),
  decision: z.enum(["verified", "rejected"]),
  message: z.string().trim().min(3, "Add a message for the customer").max(1000),
});
