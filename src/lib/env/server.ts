import "server-only";
import { z } from "zod";

const serverSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("BluBook"),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_ENVIRONMENT: z.enum(["local", "staging", "production"]),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export const env = serverSchema.parse(process.env);
