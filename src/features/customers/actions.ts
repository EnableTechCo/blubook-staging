"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/services/profiles";
import { updateCustomerDetailsSchema } from "@/lib/validation/customers";

export type UpdateCustomerState = { error: string } | undefined;

export async function updateCustomerDetails(
  _previous: UpdateCustomerState,
  formData: FormData,
): Promise<UpdateCustomerState> {
  const staff = await getCurrentProfile();
  if (!staff || staff.user_type !== "staff") return { error: "Only staff can update customers." };

  const parsed = updateCustomerDetailsSchema.safeParse({
    clientId: formData.get("clientId"),
    registeredName: formData.get("registeredName"),
    tradingName: formData.get("tradingName"),
    entityType: formData.get("entityType"),
    registrationNumber: formData.get("registrationNumber"),
    industry: formData.get("industry"),
    fullName: formData.get("fullName"),
    jobTitle: formData.get("jobTitle"),
    email: formData.get("email"),
    telephone: formData.get("telephone"),
    billingContactName: formData.get("billingContactName"),
    billingContactEmail: formData.get("billingContactEmail"),
    businessAddressLine1: formData.get("businessAddressLine1"),
    businessAddressLine2: formData.get("businessAddressLine2"),
    businessCity: formData.get("businessCity"),
    businessProvince: formData.get("businessProvince"),
    businessPostalCode: formData.get("businessPostalCode"),
    businessCountry: formData.get("businessCountry"),
    billingAddressLine1: formData.get("billingAddressLine1"),
    billingAddressLine2: formData.get("billingAddressLine2"),
    billingCity: formData.get("billingCity"),
    billingProvince: formData.get("billingProvince"),
    billingPostalCode: formData.get("billingPostalCode"),
    billingCountry: formData.get("billingCountry"),
    vatStatus: formData.get("vatStatus"),
    vatNumber: formData.get("vatNumber"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid customer details." };
  }

  const input = parsed.data;
  const admin = createAdminClient();
  const { data: client, error: clientError } = await admin
    .from("clients")
    .select("id,primary_profile_id")
    .eq("id", input.clientId)
    .single();
  if (clientError || !client) return { error: "Customer account not found." };
  if (!client.primary_profile_id) return { error: "This customer has no primary login to update." };

  const authUpdate = await admin.auth.admin.updateUserById(client.primary_profile_id, {
    email: input.email,
    email_confirm: true,
    user_metadata: { user_type: "client", full_name: input.fullName },
  });
  if (authUpdate.error) return { error: authUpdate.error.message };

  const [profileUpdate, customerUpdate] = await Promise.all([
    admin
      .from("profiles")
      .update({ full_name: input.fullName, email: input.email })
      .eq("id", client.primary_profile_id),
    admin
      .from("clients")
      .update({
        business_name: input.tradingName,
        registered_name: input.registeredName,
        trading_name: input.tradingName,
        entity_type: input.entityType,
        registration_number: input.registrationNumber || null,
        industry: input.industry,
        primary_contact_job_title: input.jobTitle,
        primary_contact_phone: input.telephone,
        billing_contact_name: input.billingContactName,
        billing_contact_email: input.billingContactEmail,
        business_address_line_1: input.businessAddressLine1,
        business_address_line_2: input.businessAddressLine2 || null,
        business_city: input.businessCity,
        business_province: input.businessProvince,
        business_postal_code: input.businessPostalCode,
        business_country: input.businessCountry,
        billing_address_line_1: input.billingAddressLine1,
        billing_address_line_2: input.billingAddressLine2 || null,
        billing_city: input.billingCity,
        billing_province: input.billingProvince,
        billing_postal_code: input.billingPostalCode,
        billing_country: input.billingCountry,
        vat_status: input.vatStatus,
        vat_number: input.vatStatus === "registered" ? input.vatNumber : null,
      })
      .eq("id", client.id),
  ]);
  if (profileUpdate.error || customerUpdate.error) {
    return {
      error: profileUpdate.error?.message ?? customerUpdate.error?.message ?? "Update failed.",
    };
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${client.id}`);
  redirect(`/dashboard/customers/${client.id}?saved=1`);
}
