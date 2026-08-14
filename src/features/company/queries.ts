import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type BankingDetails = Tables<"client_banking_details">;

/**
 * The signed-in client's banking details, or null.
 *
 * Read under the caller's own session. For anybody but the client this returns
 * null because the policy admits no other reader, which is the intended answer
 * rather than an error to handle.
 */
export async function getBankingDetails(): Promise<BankingDetails | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("client_banking_details").select("*").maybeSingle();
  return data ?? null;
}
