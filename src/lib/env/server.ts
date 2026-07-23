import "server-only";
import { z } from "zod";

const serverSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("BluBook"),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_ENVIRONMENT: z.enum(["local", "staging", "production"]),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  // Server-only, privileged (bypasses RLS). Optional so builds/CI without it
  // don't fail; features that need it validate presence at call time.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

export const env = serverSchema.parse(process.env);
