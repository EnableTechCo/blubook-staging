"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";

const idSchema = z.string().uuid();

function revalidateRequestViews(requestId?: FormDataEntryValue | null): void {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/documents");
  revalidatePath("/dashboard/transact");
  revalidatePath("/dashboard/reports/requests");

  const parsedRequestId = idSchema.safeParse(requestId);
  if (parsedRequestId.success) {
    revalidatePath(`/dashboard/reports/requests/${parsedRequestId.data}`);
  }
}

// Provider accepts an offer: the routing RPC marks the assignment accepted (it
// authorises the caller as the offered provider) and moves the request from
// 'open' to 'assigned'. Starting the work is a separate, deliberate step.
export async function acceptOffer(formData: FormData): Promise<void> {
  const id = idSchema.safeParse(formData.get("assignmentId"));
  if (!id.success) return;

  const supabase = await createClient();
  await supabase.rpc("accept_assignment", { p_assignment_id: id.data });
  revalidateRequestViews(formData.get("requestId"));
}

// Provider rejects an offer: the RPC records the rejection and re-routes to the
// next eligible provider (never the one who rejected).
export async function rejectOffer(formData: FormData): Promise<void> {
  const id = idSchema.safeParse(formData.get("assignmentId"));
  if (!id.success) return;

  const supabase = await createClient();
  await supabase.rpc("reject_assignment", { p_assignment_id: id.data });
  revalidateRequestViews(formData.get("requestId"));
}

const statusSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["in_progress", "completed", "cancelled"]),
});

// Provider advances or cancels a request they are assigned to. RLS restricts the
// update to the assigned provider (or staff); the request guard permits status
// changes (only assignment/identity fields are protected).
export async function setRequestStatus(formData: FormData): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile || profile.user_type !== "service_provider") return;

  const parsed = statusSchema.safeParse({
    requestId: formData.get("requestId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.from("service_requests").update({ status: parsed.data.status }).eq("id", parsed.data.requestId);
  revalidateRequestViews(parsed.data.requestId);
}
