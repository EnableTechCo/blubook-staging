"use client";

import { createContext, useActionState, useContext, useState } from "react";
import { updateCustomerSection, type UpdateCustomerState } from "@/features/customers/actions";
import { Button } from "@/components/ui/Button";
import { fieldStyles, labelStyles } from "@/components/ui/formStyles";

const entityTypes = [
  ["private_company", "Private company (Pty) Ltd"], ["public_company", "Public company Ltd"],
  ["personal_liability_company", "Personal liability company Inc."], ["non_profit_company", "Non-profit company NPC"],
  ["state_owned_company", "State-owned company SOC Ltd"], ["close_corporation", "Close corporation CC"],
  ["cooperative", "Co-operative"], ["trust", "Trust"], ["sole_proprietor", "Sole proprietor"],
  ["partnership", "Partnership"], ["other", "Other"],
] as const;

const provinces = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
  "Mpumalanga", "North West", "Northern Cape", "Western Cape",
];

// Whether the viewer may actually save. Read access to the customer list is
// deliberately wider than write access, so the fields are shown to everyone and
// the form around them is not. A disabled save button would be a smaller change
// but a worse one: it looks like something you could earn by trying again.
const CanEditContext = createContext(true);

type CustomerSection = "business" | "primary_contact" | "billing_contact" | "business_address" | "billing_address" | "tax";

export interface EditableCustomer {
  id: string;
  updated_at: string;
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

function Field({ id, label, defaultValue, type = "text", optional = false, ...props }: {
  id: string; label: string; defaultValue?: string | null; type?: string; optional?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "name" | "defaultValue" | "type">) {
  return (
    <div>
      <label htmlFor={id} className={labelStyles}>{label} {optional ? <span className="font-normal text-ink/45">(optional)</span> : null}</label>
      <input id={id} name={id} type={type} defaultValue={defaultValue ?? ""} required={!optional} className={fieldStyles} {...props} />
    </div>
  );
}

function ProvinceField({ id, value }: { id: string; value: string | null }) {
  return (
    <div>
      <label htmlFor={id} className={labelStyles}>Province</label>
      <select id={id} name={id} defaultValue={value ?? ""} required className={fieldStyles}>
        <option value="">Select province</option>
        {provinces.map((province) => <option key={province}>{province}</option>)}
      </select>
    </div>
  );
}

function SectionEditor({ clientId, section, title, summary, children }: {
  clientId: string;
  section: CustomerSection;
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  const canEdit = useContext(CanEditContext);
  const [state, action, pending] = useActionState<UpdateCustomerState, FormData>(updateCustomerSection, undefined);
  return (
    <details className="group border border-ink bg-paper-light">
      <summary className="grid min-h-20 cursor-pointer list-none gap-2 px-5 py-4 sm:grid-cols-[13rem_minmax(0,1fr)_auto] sm:items-center [&::-webkit-details-marker]:hidden">
        <h2 className="font-heading text-2xl">{title}</h2>
        <p className="text-sm leading-6 text-ink/60">{summary}</p>
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.09em] text-cobalt group-open:hidden">
          {canEdit ? "Edit section" : "View section"}
        </span>
        <span className="hidden font-mono text-[9px] font-semibold uppercase tracking-[0.09em] text-cobalt group-open:inline">Close</span>
      </summary>
      {canEdit ? (
      <form action={action} aria-busy={pending} className="border-t border-ink px-5 py-5">
        <input type="hidden" name="clientId" value={clientId} />
        <input type="hidden" name="section" value={section} />
        <div className="grid gap-5 sm:grid-cols-2">{children}</div>
        {state?.error ? <p role="alert" className="mt-5 border border-clay bg-clay/10 px-4 py-3 text-sm text-clay">{state.error}</p> : null}
        <div className="mt-5 flex justify-end border-t border-ink/30 pt-5"><Button type="submit" disabled={pending}>{pending ? "Saving…" : `Save ${title.toLowerCase()}`}</Button></div>
      </form>
      ) : (
        <div className="border-t border-ink px-5 py-5">
          <fieldset disabled className="grid gap-5 sm:grid-cols-2">{children}</fieldset>
          <p className="mt-5 border-t border-ink/30 pt-5 text-sm text-ink/55">
            Customer records are edited by operations.
          </p>
        </div>
      )}
    </details>
  );
}

function BusinessFields({ customer }: { customer: EditableCustomer }) {
  const [entityType, setEntityType] = useState(customer.entity_type ?? "");
  const registrationRequired = !["", "sole_proprietor", "partnership"].includes(entityType);
  return (
    <>
      <Field id="registeredName" label="Registered company name" defaultValue={customer.registered_name} />
      <Field id="tradingName" label="Trading name" defaultValue={customer.trading_name} />
      <div><label htmlFor="entityType" className={labelStyles}>Entity type</label><select id="entityType" name="entityType" value={entityType} onChange={(event) => setEntityType(event.target.value)} required className={fieldStyles}><option value="">Select entity type</option>{entityTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <Field id="registrationNumber" label="Registration / entity reference number" defaultValue={customer.registration_number} optional={!registrationRequired} />
      <div className="sm:col-span-2"><Field id="industry" label="Industry" defaultValue={customer.industry} /></div>
    </>
  );
}

function TaxFields({ customer }: { customer: EditableCustomer }) {
  const [vatStatus, setVatStatus] = useState(customer.vat_status ?? "");
  return (
    <>
      <div><label htmlFor="vatStatus" className={labelStyles}>VAT status</label><select id="vatStatus" name="vatStatus" value={vatStatus} onChange={(event) => setVatStatus(event.target.value)} required className={fieldStyles}><option value="">Select VAT status</option><option value="registered">VAT registered</option><option value="not_registered">Not VAT registered</option><option value="pending">Registration pending</option></select></div>
      {vatStatus === "registered" ? <Field id="vatNumber" label="VAT number" defaultValue={customer.vat_number} inputMode="numeric" pattern="[0-9]{10}" maxLength={10} /> : <input type="hidden" name="vatNumber" value="" />}
    </>
  );
}

const shown = (...values: (string | null | undefined)[]) => values.filter(Boolean).join(" · ") || "No information captured";

export function CustomerEditor({
  customer,
  canEdit = true,
}: {
  customer: EditableCustomer;
  canEdit?: boolean;
}) {
  const version = customer.updated_at;
  return (
    <CanEditContext.Provider value={canEdit}>
    <div className="mt-8 space-y-3">
      <p className="text-sm leading-6 text-ink/60">
        {canEdit
          ? "Choose a section to update. Saved information is prefilled, and only the open section is submitted."
          : "Choose a section to review. These details are maintained by operations."}
      </p>

      <SectionEditor key={`business-${version}`} clientId={customer.id} section="business" title="Business details" summary={shown(customer.trading_name, customer.registered_name, customer.industry)}>
        <BusinessFields customer={customer} />
      </SectionEditor>

      <SectionEditor key={`primary-${version}`} clientId={customer.id} section="primary_contact" title="Primary contact" summary={shown(customer.primaryContactName, customer.primaryContactEmail, customer.primary_contact_phone)}>
        <Field id="fullName" label="Contact name" defaultValue={customer.primaryContactName} autoComplete="name" />
        <Field id="jobTitle" label="Job title" defaultValue={customer.primary_contact_job_title} autoComplete="organization-title" />
        <Field id="email" label="Email" type="email" defaultValue={customer.primaryContactEmail} autoComplete="email" />
        <Field id="telephone" label="Telephone number" type="tel" defaultValue={customer.primary_contact_phone} autoComplete="tel" />
      </SectionEditor>

      <SectionEditor key={`billing-contact-${version}`} clientId={customer.id} section="billing_contact" title="Billing contact" summary={shown(customer.billing_contact_name, customer.billing_contact_email)}>
        <Field id="billingContactName" label="Billing contact name" defaultValue={customer.billing_contact_name} />
        <Field id="billingContactEmail" label="Billing contact email" type="email" defaultValue={customer.billing_contact_email} />
      </SectionEditor>

      <SectionEditor key={`business-address-${version}`} clientId={customer.id} section="business_address" title="Business address" summary={shown(customer.business_address_line_1, customer.business_city, customer.business_province, customer.business_postal_code)}>
        <div className="sm:col-span-2"><Field id="businessAddressLine1" label="Address line 1" defaultValue={customer.business_address_line_1} /></div>
        <div className="sm:col-span-2"><Field id="businessAddressLine2" label="Address line 2" defaultValue={customer.business_address_line_2} optional /></div>
        <Field id="businessCity" label="City" defaultValue={customer.business_city} />
        <ProvinceField id="businessProvince" value={customer.business_province} />
        <Field id="businessPostalCode" label="Postal code" defaultValue={customer.business_postal_code} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} />
        <Field id="businessCountry" label="Country" defaultValue={customer.business_country ?? "South Africa"} />
      </SectionEditor>

      <SectionEditor key={`billing-address-${version}`} clientId={customer.id} section="billing_address" title="Billing address" summary={shown(customer.billing_address_line_1, customer.billing_city, customer.billing_province, customer.billing_postal_code)}>
        <div className="sm:col-span-2"><Field id="billingAddressLine1" label="Address line 1" defaultValue={customer.billing_address_line_1} /></div>
        <div className="sm:col-span-2"><Field id="billingAddressLine2" label="Address line 2" defaultValue={customer.billing_address_line_2} optional /></div>
        <Field id="billingCity" label="City" defaultValue={customer.billing_city} />
        <ProvinceField id="billingProvince" value={customer.billing_province} />
        <Field id="billingPostalCode" label="Postal code" defaultValue={customer.billing_postal_code} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} />
        <Field id="billingCountry" label="Country" defaultValue={customer.billing_country ?? "South Africa"} />
      </SectionEditor>

      <SectionEditor key={`tax-${version}`} clientId={customer.id} section="tax" title="Tax information" summary={shown(customer.vat_status?.replaceAll("_", " "), customer.vat_number)}>
        <TaxFields customer={customer} />
      </SectionEditor>
    </div>
    </CanEditContext.Provider>
  );
}
