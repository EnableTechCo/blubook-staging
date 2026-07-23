"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";

const idSchema = z.string().uuid();

// Provider accepts an offer: the routing RPC marks the assignment accepted (it
// authorises the caller as the offered provider), then the request moves to
// in_progress. Both run under the provider's session, so RLS applies.
export async function acceptOffer(formData: FormData): Promise<void> {
  const id = idSchema.safeParse(formData.get("assignmentId"));
  if (!id.success) return;

  const supabase = await createClient();
  const { data: assignment } = await supabase
    .from("request_assignments")
    .select("request_id")
    .eq("id", id.data)
    .single();

  const { error } = await supabase.rpc("accept_assignment", { p_assignment_id: id.data });
  if (!error && assignment?.request_id) {
    await supabase.from("service_requests").update({ status: "in_progress" }).eq("id", assignment.request_id);
  }
  revalidatePath("/dashboard");
}

// Provider rejects an offer: the RPC records the rejection and re-routes to the
// next eligible provider (never the one who rejected).
export async function rejectOffer(formData: FormData): Promise<void> {
  const id = idSchema.safeParse(formData.get("assignmentId"));
  if (!id.success) return;

  const supabase = await createClient();
  await supabase.rpc("reject_assignment", { p_assignment_id: id.data });
  revalidatePath("/dashboard");
}

const statusSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["completed", "cancelled"]),
});

// Provider advances or cancels a request they are assigned to. RLS restricts the
// update to the assigned provider (or staff); the request guard permits status
// changes (only assignment/identity fields are protected).
export async function setRequestStatus(formData: FormData): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const parsed = statusSchema.safeParse({
    requestId: formData.get("requestId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.from("service_requests").update({ status: parsed.data.status }).eq("id", parsed.data.requestId);
  revalidatePath("/dashboard");
}
