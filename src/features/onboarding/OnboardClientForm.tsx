"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { onboardClient, type OnboardState } from "@/features/onboarding/actions";
import {
  PackageBuilder,
  type BuilderLineItem,
  type BuilderPackage,
} from "@/features/onboarding/PackageBuilder";
import { Button, buttonStyles } from "@/components/ui/Button";
import { fieldStyles, fileFieldStyles, helpTextStyles, labelStyles } from "@/components/ui/formStyles";

const provinces = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
  "Mpumalanga", "North West", "Northern Cape", "Western Cape",
];

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

type Address = { line1: string; line2: string; city: string; province: string; postalCode: string };
const emptyAddress: Address = { line1: "", line2: "", city: "", province: "", postalCode: "" };

function Step({ number, title, description, children }: {
  number: string; title: string; description: string; children: React.ReactNode;
}) {
  return (
    <fieldset className="grid gap-5 border-t border-ink py-7 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
      <legend className="sr-only">{title}</legend>
      <div>
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-cobalt">Step {number}</span>
        <h2 className="mt-2 font-heading text-2xl">{title}</h2>
        <p className="mt-2 text-xs leading-5 text-ink/55">{description}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </fieldset>
  );
}

function Check({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-ink">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-cobalt" />
      {label}
    </label>
  );
}

function AddressFields({ prefix, value, onChange, readOnly = false }: {
  prefix: "business" | "billing"; value: Address; onChange: (value: Address) => void; readOnly?: boolean;
}) {
  const set = (key: keyof Address, next: string) => onChange({ ...value, [key]: next });
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor={`${prefix}AddressLine1`} className={labelStyles}>Address line 1</label>
        <input id={`${prefix}AddressLine1`} name={`${prefix}AddressLine1`} value={value.line1} onChange={(e) => set("line1", e.target.value)} readOnly={readOnly} required className={fieldStyles} autoComplete={prefix === "billing" ? "billing address-line1" : "street-address"} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${prefix}AddressLine2`} className={labelStyles}>Address line 2 <span className="font-normal text-ink/45">(optional)</span></label>
        <input id={`${prefix}AddressLine2`} name={`${prefix}AddressLine2`} value={value.line2} onChange={(e) => set("line2", e.target.value)} readOnly={readOnly} className={fieldStyles} />
      </div>
      <div>
        <label htmlFor={`${prefix}City`} className={labelStyles}>City</label>
        <input id={`${prefix}City`} name={`${prefix}City`} value={value.city} onChange={(e) => set("city", e.target.value)} readOnly={readOnly} required className={fieldStyles} />
      </div>
      <div>
        <label htmlFor={`${prefix}Province`} className={labelStyles}>Province</label>
        <select id={`${prefix}Province`} name={`${prefix}Province`} value={value.province} onChange={(e) => set("province", e.target.value)} disabled={readOnly} required className={fieldStyles}>
          <option value="">Select province</option>
          {provinces.map((province) => <option key={province}>{province}</option>)}
        </select>
        {readOnly ? <input type="hidden" name={`${prefix}Province`} value={value.province} /> : null}
      </div>
      <div>
        <label htmlFor={`${prefix}PostalCode`} className={labelStyles}>Postal code</label>
        <input id={`${prefix}PostalCode`} name={`${prefix}PostalCode`} value={value.postalCode} onChange={(e) => set("postalCode", e.target.value)} readOnly={readOnly} required inputMode="numeric" pattern="[0-9]{4}" maxLength={4} className={fieldStyles} />
      </div>
      <div>
        <label className={labelStyles}>Country</label>
        <input name={`${prefix}Country`} value="South Africa" readOnly className={fieldStyles} />
      </div>
    </div>
  );
}

export function OnboardClientForm({ packages, lineItems }: { packages: BuilderPackage[]; lineItems: BuilderLineItem[] }) {
  const [state, action, pending] = useActionState<OnboardState, FormData>(onboardClient, undefined);
  const [registeredName, setRegisteredName] = useState("");
  const [tradingName, setTradingName] = useState("");
  const [sameBusinessName, setSameBusinessName] = useState(true);
  const [entityType, setEntityType] = useState("");
  const [primaryName, setPrimaryName] = useState("");
  const [primaryEmail, setPrimaryEmail] = useState("");
  const [billingName, setBillingName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [sameContact, setSameContact] = useState(true);
  const [businessAddress, setBusinessAddress] = useState<Address>(emptyAddress);
  const [billingAddress, setBillingAddress] = useState<Address>(emptyAddress);
  const [sameAddress, setSameAddress] = useState(true);
  const [vatStatus, setVatStatus] = useState("");
  const registrationRequired = !["", "sole_proprietor", "partnership"].includes(entityType);

  const updateRegisteredName = (value: string) => { setRegisteredName(value); if (sameBusinessName) setTradingName(value); };
  const updatePrimaryName = (value: string) => { setPrimaryName(value); if (sameContact) setBillingName(value); };
  const updatePrimaryEmail = (value: string) => { setPrimaryEmail(value); if (sameContact) setBillingEmail(value); };
  const updateBusinessAddress = (value: Address) => { setBusinessAddress(value); if (sameAddress) setBillingAddress(value); };

  return (
    <form action={action} aria-busy={pending}>
      <Step number="01" title="Business details" description="Record the organisation's legal identity and trading profile.">
        <div className="border border-ink/25 bg-paper px-4 py-3">
          <p className={labelStyles}>Customer ID</p>
          <p className="mt-1 text-sm">Assigned automatically when the account is created.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="registeredName" className={labelStyles}>Registered company name</label>
            <input id="registeredName" name="registeredName" value={registeredName} onChange={(e) => updateRegisteredName(e.target.value)} required className={fieldStyles} />
          </div>
          <div>
            <label htmlFor="tradingName" className={labelStyles}>Trading name</label>
            <input id="tradingName" name="tradingName" value={tradingName} onChange={(e) => setTradingName(e.target.value)} readOnly={sameBusinessName} required className={fieldStyles} />
          </div>
        </div>
        <Check checked={sameBusinessName} onChange={(checked) => { setSameBusinessName(checked); if (checked) setTradingName(registeredName); }} label="Trading name is the same as the registered company name" />
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="entityType" className={labelStyles}>Entity type</label>
            <select id="entityType" name="entityType" value={entityType} onChange={(e) => setEntityType(e.target.value)} required className={fieldStyles}>
              <option value="">Select entity type</option>
              {entityTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="registrationNumber" className={labelStyles}>Registration / entity reference number {!registrationRequired ? <span className="font-normal text-ink/45">(if applicable)</span> : null}</label>
            <input id="registrationNumber" name="registrationNumber" required={registrationRequired} className={fieldStyles} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="industry" className={labelStyles}>Industry</label>
            <input id="industry" name="industry" required className={fieldStyles} placeholder="e.g. Hospitality" />
          </div>
        </div>
      </Step>

      <Step number="02" title="Primary contact" description="Create the named contact and their initial account credentials.">
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label htmlFor="fullName" className={labelStyles}>Contact name</label><input id="fullName" name="fullName" value={primaryName} onChange={(e) => updatePrimaryName(e.target.value)} required className={fieldStyles} autoComplete="name" /></div>
          <div><label htmlFor="jobTitle" className={labelStyles}>Job title</label><input id="jobTitle" name="jobTitle" required className={fieldStyles} autoComplete="organization-title" /></div>
          <div><label htmlFor="email" className={labelStyles}>Email</label><input id="email" name="email" type="email" value={primaryEmail} onChange={(e) => updatePrimaryEmail(e.target.value)} required className={fieldStyles} autoComplete="email" /></div>
          <div><label htmlFor="telephone" className={labelStyles}>Telephone number</label><input id="telephone" name="telephone" type="tel" required className={fieldStyles} autoComplete="tel" /></div>
        </div>
        <div><label htmlFor="tempPassword" className={labelStyles}>Temporary password</label><input id="tempPassword" name="tempPassword" type="text" required minLength={8} className={fieldStyles} aria-describedby="password-help" /><p id="password-help" className={helpTextStyles}>Use at least 8 characters. Share this securely so the client can sign in.</p></div>
      </Step>

      <Step number="03" title="Billing contact" description="Set the person who should receive billing correspondence.">
        <Check checked={sameContact} onChange={(checked) => { setSameContact(checked); if (checked) { setBillingName(primaryName); setBillingEmail(primaryEmail); } }} label="Same as primary contact" />
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label htmlFor="billingContactName" className={labelStyles}>Billing contact name</label><input id="billingContactName" name="billingContactName" value={billingName} onChange={(e) => setBillingName(e.target.value)} readOnly={sameContact} required className={fieldStyles} /></div>
          <div><label htmlFor="billingContactEmail" className={labelStyles}>Billing contact email</label><input id="billingContactEmail" name="billingContactEmail" type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} readOnly={sameContact} required className={fieldStyles} /></div>
        </div>
      </Step>

      <Step number="04" title="Business address" description="Capture the organisation's physical business address.">
        <AddressFields prefix="business" value={businessAddress} onChange={updateBusinessAddress} />
      </Step>

      <Step number="05" title="Billing address" description="Set the address used for invoices and billing records.">
        <Check checked={sameAddress} onChange={(checked) => { setSameAddress(checked); if (checked) setBillingAddress(businessAddress); }} label="Same as business address" />
        <AddressFields prefix="billing" value={billingAddress} onChange={setBillingAddress} readOnly={sameAddress} />
      </Step>

      <Step number="06" title="Tax information" description="Record the client's South African VAT status.">
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label htmlFor="vatStatus" className={labelStyles}>VAT status</label><select id="vatStatus" name="vatStatus" value={vatStatus} onChange={(e) => setVatStatus(e.target.value)} required className={fieldStyles}><option value="">Select VAT status</option><option value="registered">VAT registered</option><option value="not_registered">Not VAT registered</option><option value="pending">Registration pending</option></select></div>
          {vatStatus === "registered" ? <div><label htmlFor="vatNumber" className={labelStyles}>VAT number</label><input id="vatNumber" name="vatNumber" required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} className={fieldStyles} aria-describedby="vat-help" /><p id="vat-help" className={helpTextStyles}>Enter the 10-digit VAT registration number.</p></div> : <input type="hidden" name="vatNumber" value="" />}
        </div>
      </Step>

      <Step number="07" title="Selected service package" description="Select the package being activated for this client.">
        <PackageBuilder packages={packages} lineItems={lineItems} />
        <p className={helpTextStyles}>The service commencement date is assigned automatically when this package is activated.</p>
        {packages.length === 0 ? <p role="alert" className="border-l-2 border-clay bg-clay/10 px-4 py-3 text-sm text-clay">No active packages are available in the catalogue.</p> : null}
      </Step>

      <Step number="08" title="Files" description="Both are optional and can be added later from the client's workspace.">
        <div><label htmlFor="artwork" className={labelStyles}>Customer artwork <span className="font-normal text-ink/45">(optional)</span></label><input id="artwork" name="artwork" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className={fileFieldStyles} aria-describedby="artwork-help" /><p id="artwork-help" className={helpTextStyles}>The client&apos;s logo, used as their profile picture. PNG, JPEG, WebP or SVG, up to 10MB.</p></div>
        <div><label htmlFor="purchaseOrder" className={labelStyles}>Purchase order <span className="font-normal text-ink/45">(optional)</span></label><input id="purchaseOrder" name="purchaseOrder" type="file" className={fileFieldStyles} aria-describedby="purchase-order-help" /><p id="purchase-order-help" className={helpTextStyles}>Filed into the client&apos;s Purchase Orders folder in their archive. Up to 10MB.</p></div>
      </Step>

      {state?.error ? <p role="alert" className="mb-5 border border-clay bg-clay/10 px-4 py-3 text-sm text-clay">{state.error}</p> : null}
      <div className="flex flex-col-reverse gap-3 border-t border-ink py-6 sm:flex-row sm:items-center sm:justify-end"><Link href="/dashboard" className={buttonStyles({ variant: "quiet" })}>Cancel</Link><Button type="submit" disabled={pending || packages.length === 0}>{pending ? "Onboarding…" : "Create client & go live"}</Button></div>
    </form>
  );
}
