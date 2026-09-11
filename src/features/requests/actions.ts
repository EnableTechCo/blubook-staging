"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";
import { ROUTES } from "@/lib/routes";

const idSchema = z.string().uuid();

function revalidateRequestViews(requestId?: FormDataEntryValue | null): void {
  revalidatePath(ROUTES.dashboard);
  revalidatePath(ROUTES.documents);
  revalidatePath(ROUTES.transact);
  revalidatePath(ROUTES.reportsRequests);

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

// A decline carries a reason. Operations reads it on the request's offer
// history, and the routing that follows is easier to judge with it than
// without: "no capacity this month" and "outside our sector" call for
// different things. Short, but not empty.
const declineSchema = z.object({
  assignmentId: idSchema,
  reason: z.string().trim().min(3, "Say briefly why").max(500),
});

// Provider rejects an offer: the RPC records the rejection with its reason and
// re-routes to the next eligible provider (never the one who rejected).
export async function rejectOffer(formData: FormData): Promise<void> {
  const parsed = declineSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    reason: formData.get("reason"),
  });
  // The form marks the reason required and the browser enforces it; a post
  // without one is not a decline, so nothing is recorded and nothing re-routes.
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.rpc("reject_assignment", {
    p_assignment_id: parsed.data.assignmentId,
    p_note: parsed.data.reason,
  });
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

// A client acknowledges receipt of a document BluBook issued them, which closes
// the delivery request. RLS restricts the update to their own requests, and the
// guard trigger permits status changes.
export async function acknowledgeDocument(formData: FormData): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile || profile.user_type !== "client") return;

  const id = idSchema.safeParse(formData.get("requestId"));
  if (!id.success) return;

  const supabase = await createClient();
  await supabase
    .from("service_requests")
    .update({ status: "completed" })
    .eq("id", id.data)
    .eq("request_type", "document_delivery")
    .eq("status", "new");

  revalidateRequestViews(id.data);
}
