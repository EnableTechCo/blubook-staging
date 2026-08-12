"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { salesOpportunityInputSchema } from "@/lib/validation/salesOpportunities";
import { salesTargetInputSchema } from "@/lib/validation/salesTargets";
import { getCurrentProfile } from "@/services/profiles";

export type OpportunityActionState =
  | { error: string }
  | { ok: true }
  | undefined;

const opportunityRequestSchema = z.object({
  opportunityId: z.string().uuid().optional(),
  expectedUpdatedAt: z.string().datetime({ offset: true }).optional(),
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
    expectedUpdatedAt: formData.get("expectedUpdatedAt") || undefined,
  });
  if (!request.success) return { error: "Invalid opportunity." };
  if (request.data.opportunityId && !request.data.expectedUpdatedAt) {
    return { error: "Refresh this opportunity before editing it." };
  }

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
        .eq("updated_at", request.data.expectedUpdatedAt!)
        .select("id")
        .maybeSingle()
    : supabase.from("sales_opportunities").insert(values).select("id").maybeSingle();
  const { data, error } = await mutation;

  if (error) return { error: error.message };
  if (!data) return { error: "The opportunity was not found in your account." };

  revalidatePath("/dashboard/sales/pipeline");
  revalidatePath("/dashboard/sales/bookings");
  return { ok: true };
}

const bookingSchema = z.object({
  opportunityId: z.string().uuid(),
  expectedUpdatedAt: z.string().datetime({ offset: true }),
  revenue: z.coerce.number().min(0).max(999999999999.99),
  paymentStatus: z.enum(["paid", "unpaid"]),
  fiscalYear: z.number().int().min(2000).max(2200).nullable(),
  fiscalQuarter: z.number().int().min(1).max(4).nullable(),
  fiscalWeek: z.number().int().min(1).max(13).nullable(),
});

export async function updateBooking(
  _previous: OpportunityActionState,
  formData: FormData,
): Promise<OpportunityActionState> {
  if (!(await isClient())) return { error: "Only clients can manage bookings." };
  const parsed = bookingSchema.safeParse({
    opportunityId: formData.get("opportunityId"),
    expectedUpdatedAt: formData.get("expectedUpdatedAt"),
    revenue: formData.get("revenue"),
    paymentStatus: formData.get("paymentStatus"),
    fiscalYear: optionalNumber(formData.get("fiscalYear")),
    fiscalQuarter: optionalNumber(formData.get("fiscalQuarter")),
    fiscalWeek: optionalNumber(formData.get("fiscalWeek")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the booking details." };
  if (!parsed.data.fiscalYear && (parsed.data.fiscalQuarter || parsed.data.fiscalWeek)) {
    return { error: "Choose a fiscal year before quarter and week." };
  }
  if (!parsed.data.fiscalQuarter && parsed.data.fiscalWeek) {
    return { error: "Choose a fiscal quarter before the week." };
  }

  const { error } = await (await createClient()).rpc("update_client_booking", {
    p_opportunity_id: parsed.data.opportunityId,
    p_expected_updated_at: parsed.data.expectedUpdatedAt,
    p_revenue: parsed.data.revenue,
    p_payment_status: parsed.data.paymentStatus,
    p_fiscal_year: parsed.data.fiscalYear,
    p_fiscal_quarter: parsed.data.fiscalQuarter,
    p_fiscal_week: parsed.data.fiscalWeek,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/sales/pipeline");
  revalidatePath("/dashboard/sales/bookings");
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

export type TargetActionState = { error: string } | { ok: true } | undefined;

/**
 * Sets, revises or clears one quarter's revenue target.
 *
 * An empty field clears the quarter rather than storing zero: a zero target is
 * a flat line at nothing, while no target is no line at all, and the two say
 * different things on a phasing chart.
 *
 * The upsert keys on the client's own unique constraint, so revising a quarter
 * updates the row it already has instead of adding a second target for the same
 * period. client_id defaults to current_client_id() and RLS checks it, so a
 * client cannot write a target against another company even by forging the form.
 */
export async function saveSalesTarget(
  _previous: TargetActionState,
  formData: FormData,
): Promise<TargetActionState> {
  if (!(await isClient())) return { error: "Only clients can set sales targets." };

  const rawWeek = formData.get("fiscalWeek");
  const period = z
    .object({
      fiscalYear: z.number().int().min(2000).max(2200),
      fiscalQuarter: z.number().int().min(1).max(4),
      // Absent for the quarter total; 1-13 for a single week's override.
      fiscalWeek: z.number().int().min(1).max(13).nullable(),
    })
    .safeParse({
      fiscalYear: Number(formData.get("fiscalYear")),
      fiscalQuarter: Number(formData.get("fiscalQuarter")),
      fiscalWeek:
        typeof rawWeek === "string" && rawWeek.trim() !== "" ? Number(rawWeek) : null,
    });
  if (!period.success) return { error: "Choose a fiscal year and quarter." };

  const supabase = await createClient();
  const raw = formData.get("revenueTarget");
  const cleared = typeof raw !== "string" || raw.trim() === "";

  if (cleared) {
    const clearing = supabase
      .from("client_sales_targets")
      .delete()
      .eq("fiscal_year", period.data.fiscalYear)
      .eq("fiscal_quarter", period.data.fiscalQuarter);
    // Clearing a week removes only that week; clearing the quarter removes the
    // total and leaves any weekly figures the client set alone.
    const { error } =
      period.data.fiscalWeek === null
        ? await clearing.is("fiscal_week", null)
        : await clearing.eq("fiscal_week", period.data.fiscalWeek);
    if (error) return { error: error.message };
    revalidatePath("/dashboard/sales/targets");
    return { ok: true };
  }

  const parsed = salesTargetInputSchema.safeParse({
    fiscalYear: period.data.fiscalYear,
    fiscalQuarter: period.data.fiscalQuarter,
    revenueTarget: Number(raw),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid target." };
  }

  const { error } = await supabase.from("client_sales_targets").upsert(
    {
      fiscal_year: parsed.data.fiscalYear,
      fiscal_quarter: parsed.data.fiscalQuarter,
      fiscal_week: period.data.fiscalWeek,
      revenue_target: parsed.data.revenueTarget,
    },
    { onConflict: "client_id,fiscal_year,fiscal_quarter,fiscal_week" },
  );
  if (error) return { error: error.message };

  revalidatePath("/dashboard/sales/targets");
  return { ok: true };
}
