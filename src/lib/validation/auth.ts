import { z } from "zod";

// Credentials for signing in. Password length mirrors the minimum Supabase Auth
// enforces so client-side validation matches server behaviour.
export const credentialsSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Self-service signup only creates clients; the account trigger defaults
// user_type to 'client'. Providers and staff are provisioned internally.
export const signUpSchema = credentialsSchema.extend({
  fullName: z.string().trim().min(1, "Enter your name").max(120),
});

export type Credentials = z.infer<typeof credentialsSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
