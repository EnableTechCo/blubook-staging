"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/services/profiles";
import { requireStaffRole } from "@/services/staffRole";
import {
  billingAddressSchema,
  billingContactSchema,
  businessAddressSchema,
  businessDetailsSchema,
  customerSectionSchema,
  primaryContactSchema,
  taxDetailsSchema,
} from "@/lib/validation/customers";

export type UpdateCustomerState = { error: string } | undefined;

const requestSchema = z.object({
  clientId: z.string().uuid(),
  section: customerSectionSchema,
});

const value = (formData: FormData, name: string) => formData.get(name);

export async function updateCustomerSection(
  _previous: UpdateCustomerState,
  formData: FormData,
): Promise<UpdateCustomerState> {
  // Everything below runs through the admin client, which bypasses RLS. The
  // customer list stays readable by every staff role; only editing narrows.
  const staff = await getCurrentProfile();
  const denied = await requireStaffRole("operations");
  if (denied || !staff) return { error: denied ?? "Not authenticated." };

  const request = requestSchema.safeParse({
    clientId: value(formData, "clientId"),
    section: value(formData, "section"),
  });
  if (!request.success) return { error: "Invalid customer update." };

  const admin = createAdminClient();
  const { data: client, error: clientError } = await admin
    .from("clients")
    .select("id,primary_profile_id")
    .eq("id", request.data.clientId)
    .single();
  if (clientError || !client) return { error: "Customer account not found." };

  let error: string | null = null;
  switch (request.data.section) {
    case "business": {
      const parsed = businessDetailsSchema.safeParse({
        registeredName: value(formData, "registeredName"),
        tradingName: value(formData, "tradingName"),
        entityType: value(formData, "entityType"),
        registrationNumber: value(formData, "registrationNumber"),
        industry: value(formData, "industry"),
      });
      if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid business details." };
      const update = await admin
        .from("clients")
        .update({
          business_name: parsed.data.tradingName,
          registered_name: parsed.data.registeredName,
          trading_name: parsed.data.tradingName,
          entity_type: parsed.data.entityType,
          registration_number: parsed.data.registrationNumber || null,
          industry: parsed.data.industry,
        })
        .eq("id", client.id);
      error = update.error?.message ?? null;
      break;
    }
    case "primary_contact": {
      if (!client.primary_profile_id) return { error: "This customer has no primary login to update." };
      const parsed = primaryContactSchema.safeParse({
        fullName: value(formData, "fullName"),
        jobTitle: value(formData, "jobTitle"),
        email: value(formData, "email"),
        telephone: value(formData, "telephone"),
      });
      if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid primary contact." };
      const authUpdate = await admin.auth.admin.updateUserById(client.primary_profile_id, {
        email: parsed.data.email,
        email_confirm: true,
        user_metadata: { user_type: "client", full_name: parsed.data.fullName },
      });
      if (authUpdate.error) return { error: authUpdate.error.message };
      const [profileUpdate, clientUpdate] = await Promise.all([
        admin
          .from("profiles")
          .update({ full_name: parsed.data.fullName, email: parsed.data.email })
          .eq("id", client.primary_profile_id),
        admin
          .from("clients")
          .update({
            primary_contact_job_title: parsed.data.jobTitle,
            primary_contact_phone: parsed.data.telephone,
          })
          .eq("id", client.id),
      ]);
      error = profileUpdate.error?.message ?? clientUpdate.error?.message ?? null;
      break;
    }
    case "billing_contact": {
      const parsed = billingContactSchema.safeParse({
        billingContactName: value(formData, "billingContactName"),
        billingContactEmail: value(formData, "billingContactEmail"),
      });
      if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid billing contact." };
      const update = await admin
        .from("clients")
        .update({
          billing_contact_name: parsed.data.billingContactName,
          billing_contact_email: parsed.data.billingContactEmail,
        })
        .eq("id", client.id);
      error = update.error?.message ?? null;
      break;
    }
    case "business_address": {
      const parsed = businessAddressSchema.safeParse({
        businessAddressLine1: value(formData, "businessAddressLine1"),
        businessAddressLine2: value(formData, "businessAddressLine2"),
        businessCity: value(formData, "businessCity"),
        businessProvince: value(formData, "businessProvince"),
        businessPostalCode: value(formData, "businessPostalCode"),
        businessCountry: value(formData, "businessCountry"),
      });
      if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid business address." };
      const update = await admin
        .from("clients")
        .update({
          business_address_line_1: parsed.data.businessAddressLine1,
          business_address_line_2: parsed.data.businessAddressLine2 || null,
          business_city: parsed.data.businessCity,
          business_province: parsed.data.businessProvince,
          business_postal_code: parsed.data.businessPostalCode,
          business_country: parsed.data.businessCountry,
        })
        .eq("id", client.id);
      error = update.error?.message ?? null;
      break;
    }
    case "billing_address": {
      const parsed = billingAddressSchema.safeParse({
        billingAddressLine1: value(formData, "billingAddressLine1"),
        billingAddressLine2: value(formData, "billingAddressLine2"),
        billingCity: value(formData, "billingCity"),
        billingProvince: value(formData, "billingProvince"),
        billingPostalCode: value(formData, "billingPostalCode"),
        billingCountry: value(formData, "billingCountry"),
      });
      if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid billing address." };
      const update = await admin
        .from("clients")
        .update({
          billing_address_line_1: parsed.data.billingAddressLine1,
          billing_address_line_2: parsed.data.billingAddressLine2 || null,
          billing_city: parsed.data.billingCity,
          billing_province: parsed.data.billingProvince,
          billing_postal_code: parsed.data.billingPostalCode,
          billing_country: parsed.data.billingCountry,
        })
        .eq("id", client.id);
      error = update.error?.message ?? null;
      break;
    }
    case "tax": {
      const parsed = taxDetailsSchema.safeParse({
        vatStatus: value(formData, "vatStatus"),
        vatNumber: value(formData, "vatNumber"),
      });
      if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid tax details." };
      const update = await admin
        .from("clients")
        .update({
          vat_status: parsed.data.vatStatus,
          vat_number: parsed.data.vatStatus === "registered" ? parsed.data.vatNumber : null,
        })
        .eq("id", client.id);
      error = update.error?.message ?? null;
      break;
    }
  }

  if (error) return { error };
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${client.id}`);
  redirect(`/dashboard/customers/${client.id}?saved=${request.data.section}`);
}
