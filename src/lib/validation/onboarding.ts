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
  z.intersection(
    z.object({
      tempPassword: z.string().min(8, "Temporary password must be at least 8 characters"),
    }),
    packageAssembly,
  ),
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
