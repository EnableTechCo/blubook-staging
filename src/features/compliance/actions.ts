"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";

export type ComplianceSettingState = { error: string } | { ok: true } | undefined;

const settingSchema = z.object({
  metricKey: z.string().min(1).max(60),
  weight: z.number().nonnegative("A weight cannot be negative").max(1000, "That weight is too large"),
  threshold: z.number().finite("Enter a valid threshold"),
  active: z.boolean(),
});

/**
 * Staff set what each metric is worth and what counts as meeting it.
 *
 * Both are needed: a weight decides how much a metric matters, and a threshold
 * decides whether it was met at all. A weight without a threshold cannot score
 * anything, which is why they are edited together on one row.
 */
export async function saveComplianceSetting(
  _previous: ComplianceSettingState,
  formData: FormData,
): Promise<ComplianceSettingState> {
  const profile = await getCurrentProfile();
  if (profile?.user_type !== "staff") {
    return { error: "Only staff can change compliance settings." };
  }

  const parsed = settingSchema.safeParse({
    metricKey: formData.get("metricKey"),
    weight: Number(formData.get("weight")),
    threshold: Number(formData.get("threshold")),
    active: formData.get("active") === "true",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the values and try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("compliance_metric_settings")
    .update({
      weight: parsed.data.weight,
      threshold: parsed.data.threshold,
      active: parsed.data.active,
    })
    .eq("metric_key", parsed.data.metricKey);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/compliance");
  return { ok: true };
}

export type OverdueSweepState = { error: string } | { ok: true; raised: number } | undefined;

/**
 * Raises notifications for every past-due request that has not already been
 * flagged. Non-urgent, so the bell stays quiet.
 *
 * Staff-triggered because this application has no scheduler. The database
 * function is idempotent, so scheduling it later — pg_cron or otherwise —
 * needs no change here.
 */
export async function sweepOverdueRequests(
  _previous: OverdueSweepState,
  _formData: FormData,
): Promise<OverdueSweepState> {
  const profile = await getCurrentProfile();
  if (profile?.user_type !== "staff") {
    return { error: "Only staff can raise overdue notifications." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("raise_overdue_request_notifications");
  if (error) return { error: error.message };

  revalidatePath("/dashboard/compliance");
  return { ok: true, raised: data ?? 0 };
}
