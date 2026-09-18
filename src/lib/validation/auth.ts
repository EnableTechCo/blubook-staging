import { z } from "zod";

// Credentials for signing in. Password length mirrors the minimum Supabase Auth
// enforces so client-side validation matches server behaviour.
export const credentialsSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type Credentials = z.infer<typeof credentialsSchema>;
