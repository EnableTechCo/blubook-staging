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

export type LetterheadState_ = { error: string } | { ok: true } | undefined;

const letterheadSchema = z.object({
  showBanking: z.boolean(),
  showRegistration: z.boolean(),
  showDirector: z.boolean(),
  contactEmail: z.string().trim().email("Enter a valid email.").max(200).optional().or(z.literal("")),
  contactPhone: z.string().trim().max(60).optional(),
  website: z.string().trim().max(200).optional(),
  footerNote: z.string().trim().max(400).optional(),
});

/** What the client's letterhead shows, and the lines it carries. */
export async function saveLetterhead(
  _previous: LetterheadState_,
  formData: FormData,
): Promise<LetterheadState_> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Not authenticated." };
  if (profile.user_type !== "client") return { error: "Only a client can set a letterhead." };

  const parsed = letterheadSchema.safeParse({
    showBanking: formData.get("showBanking") === "on",
    showRegistration: formData.get("showRegistration") === "on",
    showDirector: formData.get("showDirector") === "on",
    contactEmail: formData.get("contactEmail") || "",
    contactPhone: formData.get("contactPhone") || undefined,
    website: formData.get("website") || undefined,
    footerNote: formData.get("footerNote") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the details." };

  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("id").maybeSingle();
  if (!client) return { error: "No client account is linked to your profile." };

  const { error } = await supabase.from("client_letterheads").upsert(
    {
      client_id: client.id,
      show_banking: parsed.data.showBanking,
      show_registration: parsed.data.showRegistration,
      show_director: parsed.data.showDirector,
      contact_email: parsed.data.contactEmail || null,
      contact_phone: parsed.data.contactPhone ?? null,
      website: parsed.data.website ?? null,
      footer_note: parsed.data.footerNote ?? null,
    },
    { onConflict: "client_id" },
  );
  if (error) return { error: error.message };

  revalidatePath("/dashboard/company");
  return { ok: true };
}
