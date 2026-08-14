"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";

export type BankingState = { error: string } | { ok: true } | undefined;

const bankingSchema = z.object({
  bankName: z.string().trim().min(1, "Enter the bank.").max(120),
  accountName: z.string().trim().min(1, "Enter the account name.").max(200),
  accountNumber: z.string().trim().min(1, "Enter the account number.").max(60),
  branchCode: z.string().trim().min(1, "Enter the branch code.").max(20),
  accountType: z.string().trim().max(60).optional(),
  swiftCode: z.string().trim().max(20).optional(),
});

/**
 * The client's own banking details, saved by the client.
 *
 * Under the client's session rather than the admin client, deliberately. The
 * admin client bypasses RLS, and the one guarantee this table makes is that
 * only the client reads it — routing the write through a session that could
 * read anybody's would make that guarantee a matter of trust in this file.
 */
export async function saveBankingDetails(
  _previous: BankingState,
  formData: FormData,
): Promise<BankingState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Not authenticated." };
  if (profile.user_type !== "client") {
    return { error: "Only a client can maintain its banking details." };
  }

  const parsed = bankingSchema.safeParse({
    bankName: formData.get("bankName"),
    accountName: formData.get("accountName"),
    accountNumber: formData.get("accountNumber"),
    branchCode: formData.get("branchCode"),
    accountType: formData.get("accountType") || undefined,
    swiftCode: formData.get("swiftCode") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the details." };

  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("id").maybeSingle();
  if (!client) return { error: "No client account is linked to your profile." };

  const { error } = await supabase.from("client_banking_details").upsert(
    {
      client_id: client.id,
      bank_name: parsed.data.bankName,
      account_name: parsed.data.accountName,
      account_number: parsed.data.accountNumber,
      branch_code: parsed.data.branchCode,
      account_type: parsed.data.accountType ?? null,
      swift_code: parsed.data.swiftCode ?? null,
    },
    { onConflict: "client_id" },
  );
  if (error) return { error: error.message };

  revalidatePath("/dashboard/company");
  return { ok: true };
}
