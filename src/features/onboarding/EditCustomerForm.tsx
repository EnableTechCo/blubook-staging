"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  updateCustomerDetails,
  type UpdateCustomerState,
} from "@/features/onboarding/actions";
import { Button, buttonStyles } from "@/components/ui/Button";
import { fieldStyles, labelStyles } from "@/components/ui/formStyles";

const entityTypes = [
  ["private_company", "Private company (Pty) Ltd"],
  ["public_company", "Public company Ltd"],
  ["personal_liability_company", "Personal liability company Inc."],
  ["non_profit_company", "Non-profit company NPC"],
  ["state_owned_company", "State-owned company SOC Ltd"],
  ["close_corporation", "Close corporation CC"],
  ["cooperative", "Co-operative"],
  ["trust", "Trust"],
  ["sole_proprietor", "Sole proprietor"],
  ["partnership", "Partnership"],
  ["other", "Other"],
] as const;

const provinces = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];

export interface EditableCustomer {
  id: string;
  registered_name: string;
  trading_name: string;
  entity_type: string | null;
  registration_number: string | null;
  industry: string | null;
  primary_contact_job_title: string | null;
  primary_contact_phone: string | null;
  billing_contact_name: string | null;
  billing_contact_email: string | null;
  business_address_line_1: string | null;
  business_address_line_2: string | null;
  business_city: string | null;
  business_province: string | null;
  business_postal_code: string | null;
  business_country: string | null;
  billing_address_line_1: string | null;
  billing_address_line_2: string | null;
  billing_city: string | null;
  billing_province: string | null;
  billing_postal_code: string | null;
  billing_country: string | null;
  vat_status: string | null;
  vat_number: string | null;
  primaryContactName: string;
  primaryContactEmail: string;
}

function Section({ title, description, children }: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="grid gap-5 border-t border-ink py-7 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
      <legend className="sr-only">{title}</legend>
      <div>
        <h2 className="font-heading text-2xl">{title}</h2>
        <p className="mt-2 text-xs leading-5 text-ink/55">{description}</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({ id, label, defaultValue, type = "text", optional = false, ...props }: {
  id: string;
  label: string;
  defaultValue?: string | null;
  type?: string;
  optional?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "name" | "defaultValue" | "type">) {
  return (
    <div>
      <label htmlFor={id} className={labelStyles}>
        {label} {optional ? <span className="font-normal text-ink/45">(optional)</span> : null}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={!optional}
        className={fieldStyles}
        {...props}
      />
    </div>
  );
}

export function EditCustomerForm({ customer }: { customer: EditableCustomer }) {
  const [state, action, pending] = useActionState<UpdateCustomerState, FormData>(
    updateCustomerDetails,
    undefined,
  );
  const [entityType, setEntityType] = useState(customer.entity_type ?? "");
  const [vatStatus, setVatStatus] = useState(customer.vat_status ?? "");
  const registrationRequired = !["", "sole_proprietor", "partnership"].includes(entityType);

  return (
    <form action={action} aria-busy={pending}>
      <input type="hidden" name="clientId" value={customer.id} />

      <Section title="Business details" description="Update the legal identity and customer-facing trading name.">
        <Field id="registeredName" label="Registered company name" defaultValue={customer.registered_name} />
        <Field id="tradingName" label="Trading name" defaultValue={customer.trading_name} />
        <div>
          <label htmlFor="entityType" className={labelStyles}>Entity type</label>
          <select id="entityType" name="entityType" value={entityType} onChange={(event) => setEntityType(event.target.value)} required className={fieldStyles}>
            <option value="">Select entity type</option>
            {entityTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <Field id="registrationNumber" label="Registration / entity reference number" defaultValue={customer.registration_number} optional={!registrationRequired} />
        <div className="sm:col-span-2"><Field id="industry" label="Industry" defaultValue={customer.industry} /></div>
      </Section>

      <Section title="Primary contact" description="Changing the email also changes the customer's sign-in email.">
        <Field id="fullName" label="Contact name" defaultValue={customer.primaryContactName} autoComplete="name" />
        <Field id="jobTitle" label="Job title" defaultValue={customer.primary_contact_job_title} autoComplete="organization-title" />
        <Field id="email" label="Email" type="email" defaultValue={customer.primaryContactEmail} autoComplete="email" />
        <Field id="telephone" label="Telephone number" type="tel" defaultValue={customer.primary_contact_phone} autoComplete="tel" />
      </Section>

      <Section title="Billing contact" description="Set the person who should receive billing correspondence.">
        <Field id="billingContactName" label="Billing contact name" defaultValue={customer.billing_contact_name} />
        <Field id="billingContactEmail" label="Billing contact email" type="email" defaultValue={customer.billing_contact_email} />
      </Section>

      <Section title="Business address" description="Update the organisation's physical business address.">
        <div className="sm:col-span-2"><Field id="businessAddressLine1" label="Address line 1" defaultValue={customer.business_address_line_1} /></div>
        <div className="sm:col-span-2"><Field id="businessAddressLine2" label="Address line 2" defaultValue={customer.business_address_line_2} optional /></div>
        <Field id="businessCity" label="City" defaultValue={customer.business_city} />
        <div>
          <label htmlFor="businessProvince" className={labelStyles}>Province</label>
          <select id="businessProvince" name="businessProvince" defaultValue={customer.business_province ?? ""} required className={fieldStyles}><option value="">Select province</option>{provinces.map((province) => <option key={province}>{province}</option>)}</select>
        </div>
        <Field id="businessPostalCode" label="Postal code" defaultValue={customer.business_postal_code} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} />
        <Field id="businessCountry" label="Country" defaultValue={customer.business_country ?? "South Africa"} />
      </Section>

      <Section title="Billing address" description="Update the address used for invoices and billing records.">
        <div className="sm:col-span-2"><Field id="billingAddressLine1" label="Address line 1" defaultValue={customer.billing_address_line_1} /></div>
        <div className="sm:col-span-2"><Field id="billingAddressLine2" label="Address line 2" defaultValue={customer.billing_address_line_2} optional /></div>
        <Field id="billingCity" label="City" defaultValue={customer.billing_city} />
        <div>
          <label htmlFor="billingProvince" className={labelStyles}>Province</label>
          <select id="billingProvince" name="billingProvince" defaultValue={customer.billing_province ?? ""} required className={fieldStyles}><option value="">Select province</option>{provinces.map((province) => <option key={province}>{province}</option>)}</select>
        </div>
        <Field id="billingPostalCode" label="Postal code" defaultValue={customer.billing_postal_code} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} />
        <Field id="billingCountry" label="Country" defaultValue={customer.billing_country ?? "South Africa"} />
      </Section>

      <Section title="Tax information" description="Update the customer's South African VAT status.">
        <div>
          <label htmlFor="vatStatus" className={labelStyles}>VAT status</label>
          <select id="vatStatus" name="vatStatus" value={vatStatus} onChange={(event) => setVatStatus(event.target.value)} required className={fieldStyles}><option value="">Select VAT status</option><option value="registered">VAT registered</option><option value="not_registered">Not VAT registered</option><option value="pending">Registration pending</option></select>
        </div>
        {vatStatus === "registered" ? <Field id="vatNumber" label="VAT number" defaultValue={customer.vat_number} inputMode="numeric" pattern="[0-9]{10}" maxLength={10} /> : <input type="hidden" name="vatNumber" value="" />}
      </Section>

      {state?.error ? <p role="alert" className="mb-5 border border-clay bg-clay/10 px-4 py-3 text-sm text-clay">{state.error}</p> : null}
      <div className="flex flex-col-reverse gap-3 border-t border-ink py-6 sm:flex-row sm:justify-end">
        <Link href="/dashboard/onboardings" className={buttonStyles({ variant: "quiet" })}>Cancel</Link>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save customer details"}</Button>
      </div>
    </form>
  );
}
