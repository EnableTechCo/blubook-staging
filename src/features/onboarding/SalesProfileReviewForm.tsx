"use client";

import { useActionState } from "react";
import { fieldStyles, labelStyles } from "@/components/ui/formStyles";
import {
  reviewOnboardingProfile,
  type SalesProfileReviewState,
} from "@/features/onboarding/actions";
import type { StaffOnboardingRow } from "@/services/onboarding";
import { buttonStyles } from "@/components/ui/Button";
import type { Enums } from "@/types/database";

type ReviewClient = NonNullable<StaffOnboardingRow["clients"]>;

const entityTypes: { value: Enums<"client_entity_type">; label: string }[] = [
  { value: "private_company", label: "Private company" },
  { value: "public_company", label: "Public company" },
  { value: "personal_liability_company", label: "Personal liability company" },
  { value: "non_profit_company", label: "Non-profit company" },
  { value: "state_owned_company", label: "State-owned company" },
  { value: "close_corporation", label: "Close corporation" },
  { value: "cooperative", label: "Co-operative" },
  { value: "trust", label: "Trust" },
  { value: "sole_proprietor", label: "Sole proprietor" },
  { value: "partnership", label: "Partnership" },
  { value: "other", label: "Other" },
];

function TextField({
  id,
  name,
  label,
  value,
}: {
  id: string;
  name: string;
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelStyles}>{label}</label>
      <input id={id} name={name} defaultValue={value ?? ""} maxLength={250} className={fieldStyles} />
    </div>
  );
}

function EntityField({ id, value }: { id: string; value: Enums<"client_entity_type"> | null }) {
  return (
    <div>
      <label htmlFor={id} className={labelStyles}>Entity type</label>
      <select id={id} name="entity_type" defaultValue={value ?? ""} className={fieldStyles}>
        <option value="">Not recorded</option>
        {entityTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    </div>
  );
}

function VatStatusField({ id, value }: { id: string; value: Enums<"vat_status"> | null }) {
  return (
    <div>
      <label htmlFor={id} className={labelStyles}>VAT status</label>
      <select id={id} name="vat_status" defaultValue={value ?? ""} className={fieldStyles}>
        <option value="">Not recorded</option>
        <option value="registered">Registered</option>
        <option value="not_registered">Not registered</option>
        <option value="pending">Pending registration</option>
      </select>
    </div>
  );
}

export function SalesProfileReviewForm({
  onboarding,
  client,
}: {
  onboarding: Pick<StaffOnboardingRow, "id" | "sales_review_status" | "sales_review_note">;
  client: ReviewClient;
}) {
  const [state, action, pending] = useActionState<SalesProfileReviewState, FormData>(
    reviewOnboardingProfile,
    undefined,
  );
  const statusLabel = onboarding.sales_review_status === "approved"
    ? "Approved by Sales"
    : onboarding.sales_review_status === "changes_requested"
      ? "Changes requested"
      : "Awaiting Sales review";
  const profileVersion = state && "profileVersion" in state
    ? state.profileVersion
    : client.profile_version;
  const fieldId = (name: string) => `profile-${onboarding.id}-${name}`;

  return (
    <section className="border-b border-ink/10 bg-cobalt-wash/15 px-5 py-4" aria-label="Sales profile review">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-ink/50">Sales profile review</p>
          <p className="mt-1 text-sm font-semibold text-ink">{statusLabel}</p>
        </div>
        {onboarding.sales_review_note ? (
          <p className="max-w-xl text-xs leading-5 text-ink/65">{onboarding.sales_review_note}</p>
        ) : null}
      </div>

      <form action={action} className="mt-4 space-y-4">
        <input type="hidden" name="onboardingId" value={onboarding.id} />
        <input type="hidden" name="expectedProfileVersion" value={profileVersion} />
        <details className="group border border-ink/10 bg-paper/70 px-3 py-2">
          <summary className="cursor-pointer py-1 text-xs font-semibold text-cobalt hover:text-cobalt-deep">
            Edit profile
          </summary>
          <div className="mt-4 space-y-5 border-t border-ink/10 pt-4">
            <div>
              <p className="mb-3 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-ink/50">Business details</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField id={fieldId("business_name")} name="business_name" label="Display name" value={client.business_name} />
                <TextField id={fieldId("registered_name")} name="registered_name" label="Registered company name" value={client.registered_name} />
                <TextField id={fieldId("trading_name")} name="trading_name" label="Trading name" value={client.trading_name} />
                <EntityField id={fieldId("entity_type")} value={client.entity_type} />
                <TextField id={fieldId("registration_number")} name="registration_number" label="Registration number" value={client.registration_number} />
                <TextField id={fieldId("industry")} name="industry" label="Industry" value={client.industry} />
                <VatStatusField id={fieldId("vat_status")} value={client.vat_status} />
                <TextField id={fieldId("vat_number")} name="vat_number" label="VAT number" value={client.vat_number} />
              </div>
            </div>

            <div>
              <p className="mb-3 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-ink/50">Contacts</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField id={fieldId("primary_contact_job_title")} name="primary_contact_job_title" label="Primary contact job title" value={client.primary_contact_job_title} />
                <TextField id={fieldId("primary_contact_phone")} name="primary_contact_phone" label="Primary contact phone" value={client.primary_contact_phone} />
                <TextField id={fieldId("billing_contact_name")} name="billing_contact_name" label="Billing contact name" value={client.billing_contact_name} />
                <TextField id={fieldId("billing_contact_email")} name="billing_contact_email" label="Billing contact email" value={client.billing_contact_email} />
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <p className="mb-3 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-ink/50">Business address</p>
                <div className="grid gap-4">
                  <TextField id={fieldId("business_address_line_1")} name="business_address_line_1" label="Address line 1" value={client.business_address_line_1} />
                  <TextField id={fieldId("business_address_line_2")} name="business_address_line_2" label="Address line 2" value={client.business_address_line_2} />
                  <TextField id={fieldId("business_city")} name="business_city" label="City" value={client.business_city} />
                  <TextField id={fieldId("business_province")} name="business_province" label="Province" value={client.business_province} />
                  <TextField id={fieldId("business_postal_code")} name="business_postal_code" label="Postal code" value={client.business_postal_code} />
                  <TextField id={fieldId("business_country")} name="business_country" label="Country" value={client.business_country} />
                </div>
              </div>
              <div>
                <p className="mb-3 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-ink/50">Billing address</p>
                <div className="grid gap-4">
                  <TextField id={fieldId("billing_address_line_1")} name="billing_address_line_1" label="Address line 1" value={client.billing_address_line_1} />
                  <TextField id={fieldId("billing_address_line_2")} name="billing_address_line_2" label="Address line 2" value={client.billing_address_line_2} />
                  <TextField id={fieldId("billing_city")} name="billing_city" label="City" value={client.billing_city} />
                  <TextField id={fieldId("billing_province")} name="billing_province" label="Province" value={client.billing_province} />
                  <TextField id={fieldId("billing_postal_code")} name="billing_postal_code" label="Postal code" value={client.billing_postal_code} />
                  <TextField id={fieldId("billing_country")} name="billing_country" label="Country" value={client.billing_country} />
                </div>
              </div>
            </div>
          </div>
        </details>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div>
            <label htmlFor={fieldId("note")} className={labelStyles}>Message to customer (required to request changes)</label>
            <textarea id={fieldId("note")} name="note" defaultValue={onboarding.sales_review_note ?? ""} rows={2} maxLength={1000} className={`${fieldStyles} resize-y`} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" name="reviewAction" value="save" disabled={pending} className={buttonStyles({ variant: "secondary" })}>Save profile</button>
            <button type="submit" name="reviewAction" value="changes_requested" disabled={pending} className={buttonStyles({ variant: "secondary" })}>Request changes</button>
            <button type="submit" name="reviewAction" value="approved" disabled={pending} className={buttonStyles({ variant: "primary" })}>Approve profile</button>
          </div>
        </div>
        {state && "error" in state ? <p role="alert" className="text-xs text-clay">{state.error}</p> : null}
        {state && "ok" in state ? (
          <p role="status" className="text-xs font-medium text-teal">
            {state.action === "save" ? "Profile saved." : state.action === "approved" ? "Profile approved." : "Changes requested."}
          </p>
        ) : null}
      </form>
    </section>
  );
}
