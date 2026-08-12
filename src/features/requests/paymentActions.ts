"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";

export type PaymentActionState = { ok: true } | { error: string } | undefined;

const schema = z.object({
  requestId: z.string().uuid(),
  expectedUpdatedAt: z.string().datetime({ offset: true }),
  paymentStatus: z.enum(["paid", "unpaid"]),
});

export async function setProviderPaymentStatus(
  _previous: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.user_type !== "service_provider") {
    return { error: "Only the assigned service provider may update this payment." };
  }
  const parsed = schema.safeParse({
    requestId: formData.get("requestId"),
    expectedUpdatedAt: formData.get("expectedUpdatedAt"),
    paymentStatus: formData.get("paymentStatus"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid payment update." };

  const { error } = await (await createClient()).rpc("set_linked_sales_order_payment", {
    p_request_id: parsed.data.requestId,
    p_expected_updated_at: parsed.data.expectedUpdatedAt,
    p_payment_status: parsed.data.paymentStatus,
  });
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/reports/requests/${parsed.data.requestId}`);
  revalidatePath("/dashboard/reports/requests");
  revalidatePath("/dashboard/sales/pipeline");
  revalidatePath("/dashboard/sales/bookings");
  return { ok: true };
}
