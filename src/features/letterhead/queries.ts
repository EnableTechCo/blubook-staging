import "server-only";
import { createClient } from "@/lib/supabase/server";
import { artworkUrl } from "@/features/dashboard/ClientArtwork";
import type { LetterheadData } from "@/features/letterhead/Letterhead";
import type { Tables } from "@/types/database";

export type LetterheadSettings = Tables<"client_letterheads">;

/** What the letterhead page needs to show its form and say what is missing. */
export interface LetterheadState {
  settings: LetterheadSettings | null;
  data: LetterheadData | null;
  /** Things the letterhead would be poorer without, named so they can be fixed. */
  gaps: string[];
}

const DEFAULTS = {
  show_banking: true,
  show_registration: true,
  show_director: true,
} as const;

/**
 * Assembles the letterhead from the client's record, its artwork and its
 * banking details.
 *
 * Read under the caller's own session throughout. The banking details admit no
 * reader but the client, so a letterhead built with the admin client would be a
 * letterhead built by something allowed to read anybody's bank account.
 */
export async function getLetterheadState(): Promise<LetterheadState> {
  const supabase = await createClient();

  const [{ data: client }, { data: settings }, { data: banking }] = await Promise.all([
    supabase
      .from("clients")
      // One string literal, not a concatenation: the client infers the row
      // type from the literal, and a joined expression infers nothing.
      .select(
        "trading_name,registered_name,registration_number,vat_number,vat_status,artwork_path,primary_contact_job_title,primary_contact_phone,primary_profile_id,business_address_line_1,business_address_line_2,business_city,business_province,business_postal_code,business_country",
      )
      .maybeSingle(),
    supabase.from("client_letterheads").select("*").maybeSingle(),
    supabase.from("client_banking_details").select("*").maybeSingle(),
  ]);

  if (!client) return { settings: null, data: null, gaps: [] };

  // The director block comes from the primary contact captured at onboarding,
  // which is the only person the record names.
  let directorName: string | null = null;
  if (client.primary_profile_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", client.primary_profile_id)
      .maybeSingle();
    directorName = profile?.full_name ?? null;
  }

  const address = [
    client.business_address_line_1,
    client.business_address_line_2,
    [client.business_city, client.business_province].filter(Boolean).join(", ") || null,
    client.business_postal_code,
    client.business_country,
  ].filter((line): line is string => Boolean(line && line.trim()));

  const gaps: string[] = [];
  if (!client.artwork_path) gaps.push("No logo — ask BluBook to add your artwork.");
  if (address.length === 0) gaps.push("No business address on your customer record.");
  if (!banking) gaps.push("No banking details — add them above.");
  if (!directorName) gaps.push("No primary contact name on your customer record.");

  return {
    settings: settings ?? null,
    gaps,
    data: {
      tradingName: client.trading_name,
      registeredName: client.registered_name,
      registrationNumber: client.registration_number,
      vatNumber: client.vat_number,
      vatStatus: client.vat_status,
      address,
      logoUrl: client.artwork_path ? artworkUrl(client.artwork_path) : null,
      directorName,
      directorTitle: client.primary_contact_job_title,
      contactEmail: settings?.contact_email ?? null,
      contactPhone: settings?.contact_phone ?? client.primary_contact_phone,
      website: settings?.website ?? null,
      footerNote: settings?.footer_note ?? null,
      banking: banking
        ? {
            bankName: banking.bank_name,
            accountName: banking.account_name,
            accountNumber: banking.account_number,
            branchCode: banking.branch_code,
            accountType: banking.account_type,
            swiftCode: banking.swift_code,
          }
        : null,
      showBanking: settings?.show_banking ?? DEFAULTS.show_banking,
      showRegistration: settings?.show_registration ?? DEFAULTS.show_registration,
      showDirector: settings?.show_director ?? DEFAULTS.show_director,
    },
  };
}
