"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { salesOpportunityInputSchema } from "@/lib/validation/salesOpportunities";
import { getCurrentProfile } from "@/services/profiles";

export type OpportunityActionState =
  | { error: string }
  | { ok: true }
  | undefined;

const opportunityRequestSchema = z.object({
  opportunityId: z.string().uuid().optional(),
});

const deleteRequestSchema = z.object({ opportunityId: z.string().uuid() });

function optionalNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  return Number(value);
}

function parseOpportunity(formData: FormData) {
  const revenue = formData.get("revenue");
  return salesOpportunityInputSchema.safeParse({
    opportunitySource: formData.get("opportunitySource"),
    opportunityName: formData.get("opportunityName"),
    forecastCategory: formData.get("forecastCategory"),
    revenue:
      typeof revenue === "string" && revenue.trim() !== ""
        ? Number(revenue)
        : Number.NaN,
    fiscalYear: optionalNumber(formData.get("fiscalYear")),
    fiscalQuarter: optionalNumber(formData.get("fiscalQuarter")),
    fiscalWeek: optionalNumber(formData.get("fiscalWeek")),
  });
}

async function isClient(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return profile?.user_type === "client";
}

export async function saveOpportunity(
  _previous: OpportunityActionState,
  formData: FormData,
): Promise<OpportunityActionState> {
  if (!(await isClient())) return { error: "Only clients can manage sales opportunities." };

  const request = opportunityRequestSchema.safeParse({
    opportunityId: formData.get("opportunityId") || undefined,
  });
  if (!request.success) return { error: "Invalid opportunity." };

  const parsed = parseOpportunity(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the opportunity details." };
  }

  const values = {
    opportunity_source: parsed.data.opportunitySource,
    opportunity_name: parsed.data.opportunityName,
    forecast_category: parsed.data.forecastCategory,
    revenue: parsed.data.revenue,
    fiscal_year: parsed.data.fiscalYear,
    fiscal_quarter: parsed.data.fiscalQuarter,
    fiscal_week: parsed.data.fiscalWeek,
  };
  const supabase = await createClient();
  const mutation = request.data.opportunityId
    ? supabase
        .from("sales_opportunities")
        .update(values)
        .eq("id", request.data.opportunityId)
        .select("id")
        .maybeSingle()
    : supabase.from("sales_opportunities").insert(values).select("id").maybeSingle();
  const { data, error } = await mutation;

  if (error) return { error: error.message };
  if (!data) return { error: "The opportunity was not found in your account." };

  revalidatePath("/dashboard/sales/pipeline");
  return { ok: true };
}

export async function deleteOpportunity(
  _previous: OpportunityActionState,
  formData: FormData,
): Promise<OpportunityActionState> {
  if (!(await isClient())) return { error: "Only clients can manage sales opportunities." };

  const request = deleteRequestSchema.safeParse({ opportunityId: formData.get("opportunityId") });
  if (!request.success) return { error: "Invalid opportunity." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sales_opportunities")
    .delete()
    .eq("id", request.data.opportunityId)
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "This opportunity cannot be deleted or is no longer available." };

  revalidatePath("/dashboard/sales/pipeline");
  return { ok: true };
}
