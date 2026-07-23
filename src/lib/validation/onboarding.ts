import { z } from "zod";

// Staff onboarding form: create a client business + login, attach a standard
// package, seed the compliance checklist.
export const onboardClientSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required").max(200),
  fullName: z.string().trim().min(1, "Contact name is required").max(120),
  email: z.string().email("Enter a valid email address"),
  tempPassword: z.string().min(8, "Temporary password must be at least 8 characters"),
  packageId: z.string().uuid("Select a package"),
});

export type OnboardClientInput = z.infer<typeof onboardClientSchema>;
