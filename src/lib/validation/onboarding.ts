import { z } from "zod";

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
  z.object({
    businessName: z.string().trim().min(1, "Business name is required").max(200),
    fullName: z.string().trim().min(1, "Contact name is required").max(120),
    email: z.string().email("Enter a valid email address"),
    tempPassword: z.string().min(8, "Temporary password must be at least 8 characters"),
  }),
  packageAssembly,
);

export type OnboardClientInput = z.infer<typeof onboardClientSchema>;

// Staff updating a compliance document's status on the onboarding checklist.
export const complianceUpdateSchema = z.object({
  documentId: z.string().uuid(),
  status: z.enum(["outstanding", "received", "verified", "rejected"]),
});
