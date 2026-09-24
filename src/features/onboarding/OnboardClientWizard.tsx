"use client";

import Link from "next/link";
import { useActionState, useMemo, useRef, useState } from "react";
import { onboardClient, type OnboardState } from "@/features/onboarding/actions";
import {
  PackageBuilder,
  type BuilderLineItem,
  type BuilderPackage,
} from "@/features/onboarding/PackageBuilder";
import {
  INTAKE_STAGES,
  applicableIntakeStages,
  intakeFieldName,
  type IntakeField,
  type IntakeStage,
} from "@/features/onboarding/intakeStages";
import {
  ENTITY_TYPE_LABELS,
  summariseOnboarding,
  type SummarySection,
} from "@/features/onboarding/onboardingSummary";
import { Button, buttonStyles } from "@/components/ui/Button";
import { fieldStyles, fileFieldStyles, helpTextStyles, labelStyles } from "@/components/ui/formStyles";

/**
 * Onboarding as a wizard.
 *
 * One form, one submission, one stage on screen at a time. The client's own
 * details come first — who they are, who to talk to, where they are, what they
 * bought — and then a stage for each work group the chosen package draws on,
 * asking what that group needs to know at a baseline. Choosing the package
 * therefore decides the rest of the wizard: the rail shows every work group,
 * and the ones the package does not touch are marked so and skipped.
 *
 * Every stage stays mounted (hidden, not unmounted), so the whole form posts
 * as one FormData to the same action the old single-page form used. Moving
 * forward checks the stage being left with the browser's own constraint
 * validation; the review stage reads the FormData back so what it shows is
 * what will be sent.
 */

export interface WizardWorkGroup {
  slug: string;
  name: string;
}

type GeneralKey = "business" | "contacts" | "addresses" | "package";
type StageKey = GeneralKey | `intake:${string}` | "files" | "review";

interface StageDef {
  key: StageKey;
  title: string;
  description: string;
  /** A group the package does not draw on: shown in the rail, never opened. */
  skipped?: boolean;
  intake?: IntakeStage;
}

const provinces = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
  "Mpumalanga", "North West", "Northern Cape", "Western Cape",
];

type Address = { line1: string; line2: string; city: string; province: string; postalCode: string };
const emptyAddress: Address = { line1: "", line2: "", city: "", province: "", postalCode: "" };

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

function Check({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-ink">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-cobalt" />
      {label}
    </label>
  );
}

function Optional() {
  return <span className="font-normal text-ink/45">(optional)</span>;
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
        <label htmlFor={`${prefix}AddressLine2`} className={labelStyles}>Address line 2 <Optional /></label>
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
        <label htmlFor={`${prefix}Country`} className={labelStyles}>Country</label>
        <input id={`${prefix}Country`} name={`${prefix}Country`} value="South Africa" readOnly className={fieldStyles} />
      </div>
    </div>
  );
}

/** One work-group question, rendered from the specification. */
function IntakeControl({ slug, field }: { slug: string; field: IntakeField }) {
  const id = `intake-${slug}-${field.key}`;
  const name = intakeFieldName(slug, field.key);
  const describedBy = field.help ? `${id}-help` : undefined;
  const label = (
    <label htmlFor={id} className={labelStyles}>
      {field.label} {field.required ? null : <Optional />}
    </label>
  );
  const help = field.help ? <p id={`${id}-help`} className={helpTextStyles}>{field.help}</p> : null;

  if (field.type === "select") {
    return (
      <div>
        {label}
        <select id={id} name={name} required={field.required} defaultValue="" className={fieldStyles} aria-describedby={describedBy}>
          <option value="">Select…</option>
          {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        {help}
      </div>
    );
  }
  if (field.type === "textarea") {
    return (
      <div className="sm:col-span-2">
        {label}
        <textarea id={id} name={name} required={field.required} rows={3} maxLength={2000} placeholder={field.placeholder} className={`${fieldStyles} min-h-24 resize-y py-3`} aria-describedby={describedBy} />
        {help}
      </div>
    );
  }
  return (
    <div>
      {label}
      <input
        id={id}
        name={name}
        type={field.type === "number" ? "text" : field.type}
        inputMode={field.type === "number" ? "numeric" : undefined}
        pattern={field.type === "number" ? "[0-9]{1,9}" : undefined}
        required={field.required}
        placeholder={field.placeholder}
        maxLength={400}
        className={fieldStyles}
        aria-describedby={describedBy}
      />
      {help}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The wizard
// ---------------------------------------------------------------------------

export function OnboardClientWizard({
  packages,
  lineItems,
  workGroups,
  inviteToken = "",
  inviteEmail = "",
}: {
  packages: BuilderPackage[];
  lineItems: BuilderLineItem[];
  /** The active, partner-facing work groups, as the catalogue names them. */
  workGroups: WizardWorkGroup[];
  inviteToken?: string;
  inviteEmail?: string;
}) {
  const [state, action, pending] = useActionState<OnboardState, FormData>(onboardClient, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // The client's details, as the old form kept them.
  const [registeredName, setRegisteredName] = useState("");
  const [tradingName, setTradingName] = useState("");
  const [sameBusinessName, setSameBusinessName] = useState(true);
  const [entityType, setEntityType] = useState("");
  const [primaryName, setPrimaryName] = useState("");
  const [primaryEmail, setPrimaryEmail] = useState(inviteEmail);
  const [billingName, setBillingName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [sameContact, setSameContact] = useState(true);
  // The Compliance Manager (Business Coach) is often someone else entirely, so
  // this one starts unticked where the billing contact starts ticked.
  const [complianceName, setComplianceName] = useState("");
  const [complianceEmail, setComplianceEmail] = useState("");
  const [sameCompliance, setSameCompliance] = useState(false);
  const [businessAddress, setBusinessAddress] = useState<Address>(emptyAddress);
  const [billingAddress, setBillingAddress] = useState<Address>(emptyAddress);
  const [sameAddress, setSameAddress] = useState(true);
  const [vatStatus, setVatStatus] = useState("");
  const registrationRequired = !["", "sole_proprietor", "partnership"].includes(entityType);

  const updateRegisteredName = (value: string) => { setRegisteredName(value); if (sameBusinessName) setTradingName(value); };
  const updatePrimaryName = (value: string) => { setPrimaryName(value); if (sameContact) setBillingName(value); if (sameCompliance) setComplianceName(value); };
  const updatePrimaryEmail = (value: string) => { setPrimaryEmail(value); if (sameContact) setBillingEmail(value); if (sameCompliance) setComplianceEmail(value); };
  const updateBusinessAddress = (value: Address) => { setBusinessAddress(value); if (sameAddress) setBillingAddress(value); };

  // The assembly decides the work-group stages.
  const allBuilderItems = useMemo(
    () => [
      ...lineItems,
      ...packages.flatMap((pkg) => pkg.items.map((item) => ({ id: item.id, workGroupSlug: item.workGroupSlug }))),
    ],
    [lineItems, packages],
  );
  const [selectedLineItemIds, setSelectedLineItemIds] = useState<string[]>(
    () => packages[0]?.items.map((item) => item.id) ?? [],
  );
  const applicable = useMemo(
    () => new Set(applicableIntakeStages(selectedLineItemIds, allBuilderItems).map((stage) => stage.slug)),
    [selectedLineItemIds, allBuilderItems],
  );

  const stages = useMemo<StageDef[]>(() => {
    const groupName = new Map(workGroups.map((group) => [group.slug, group.name]));
    const intakeStages: StageDef[] = INTAKE_STAGES.filter((stage) => groupName.has(stage.slug)).map((stage) => ({
      key: `intake:${stage.slug}` as const,
      title: groupName.get(stage.slug) ?? stage.slug,
      description: stage.purpose,
      skipped: !applicable.has(stage.slug),
      intake: stage,
    }));
    return [
      { key: "business", title: "Business details", description: "The organisation's legal identity and trading profile." },
      { key: "contacts", title: "Contacts and login", description: "Your primary contact and who receives billing correspondence." },
      { key: "addresses", title: "Addresses and tax", description: "Where the business operates, where invoices go, and its VAT standing." },
      { key: "package", title: "Service package", description: "The package being activated. This decides which work groups take part below." },
      ...intakeStages,
      { key: "files", title: "Files", description: "All optional, and each can be added later from the client's workspace." },
      { key: "review", title: "Review and create", description: "Check everything before the account goes live." },
    ];
  }, [workGroups, applicable]);

  const openStages = stages.filter((stage) => !stage.skipped);
  const [current, setCurrent] = useState<StageKey>("business");
  const [visited, setVisited] = useState<Set<StageKey>>(() => new Set(["business"]));
  const [summary, setSummary] = useState<SummarySection[]>([]);

  // If the package changed underneath the current stage and removed it, fall
  // back to the package stage rather than standing on a stage that no longer exists.
  const currentIndex = openStages.findIndex((stage) => stage.key === current);
  const safeIndex = currentIndex === -1 ? openStages.findIndex((stage) => stage.key === "package") : currentIndex;
  const currentStage = openStages[safeIndex];

  function stageElement(key: StageKey): HTMLElement | null {
    return formRef.current?.querySelector<HTMLElement>(`[data-stage="${key}"]`) ?? null;
  }

  /** The first invalid control in a stage, reported to the user, or null when the stage is valid. */
  function firstInvalidIn(key: StageKey): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null {
    const root = stageElement(key);
    if (!root) return null;
    for (const control of root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea")) {
      if (!control.disabled && !control.checkValidity()) return control;
    }
    return null;
  }

  function open(key: StageKey) {
    if (key === "review" && formRef.current) {
      setSummary(
        summariseOnboarding(new FormData(formRef.current), {
          packages,
          intakeStages: stages
            .filter((stage) => stage.intake && !stage.skipped)
            .map((stage) => ({ slug: stage.intake!.slug, name: stage.title })),
        }),
      );
    }
    setCurrent(key);
    setVisited((previous) => new Set(previous).add(key));
    formRef.current?.scrollIntoView?.({ block: "start", behavior: "smooth" });
  }

  function goTo(key: StageKey) {
    const targetIndex = openStages.findIndex((stage) => stage.key === key);
    if (targetIndex > safeIndex) {
      const invalid = firstInvalidIn(currentStage.key);
      if (invalid) { invalid.reportValidity(); return; }
    }
    open(key);
  }

  const next = openStages[safeIndex + 1];
  const previous = openStages[safeIndex - 1];

  return (
    <form
      data-invitation-form
      ref={formRef}
      action={action}
      noValidate
      aria-busy={pending}
      onSubmit={(event) => {
        // Every stage is checked before the post leaves, since a stage passed
        // on the way through can be edited again from the rail.
        for (const stage of openStages) {
          const invalid = firstInvalidIn(stage.key);
          if (invalid) {
            event.preventDefault();
            open(stage.key);
            setTimeout(() => invalid.reportValidity(), 0);
            return;
          }
        }
      }}
      className="mt-8 grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10"
    >
      {/* The rail */}
      <input type="hidden" name="inviteToken" value={inviteToken} />
      <nav aria-label="Account setup stages" className="self-start lg:sticky lg:top-24">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-cobalt">
          Stage {safeIndex + 1} of {openStages.length}
        </p>
        <ol className="mt-3 flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
          {stages.map((stage) => {
            const openIndex = openStages.findIndex((candidate) => candidate.key === stage.key);
            const isCurrent = stage.key === currentStage.key;
            const isDone = visited.has(stage.key) && !isCurrent && !stage.skipped;
            const reachable = !stage.skipped && (visited.has(stage.key) || openIndex === safeIndex + 1);
            return (
              <li key={stage.key} className="shrink-0">
                <button
                  type="button"
                  onClick={() => goTo(stage.key)}
                  disabled={!reachable || isCurrent}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`flex w-full items-start gap-3 rounded-md border px-3 py-2.5 text-left transition-colors ${
                    isCurrent
                      ? "border-cobalt bg-cobalt-wash text-cobalt-deep"
                      : stage.skipped
                        ? "border-transparent text-ink/35"
                        : reachable
                          ? "border-transparent text-ink hover:bg-paper-light"
                          : "border-transparent text-ink/50"
                  } disabled:cursor-default`}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border font-mono text-[9px] font-semibold ${
                      isDone
                        ? "border-teal bg-teal text-paper"
                        : isCurrent
                          ? "border-cobalt bg-cobalt text-paper"
                          : "border-ink/25"
                    }`}
                  >
                    {isDone ? "✓" : stage.skipped ? "–" : openIndex + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-5">{stage.title}</span>
                    {stage.skipped ? (
                      <span className="block text-[11px] leading-4">Not in this package</span>
                    ) : stage.intake ? (
                      <span className="block text-[11px] leading-4 text-ink/50">Work group intake</span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* The stage on screen */}
      <div className="min-w-0">
        <section className="workspace-panel" aria-live="polite">
          <header className="workspace-panel-header">
            <div>
              <p className="workspace-eyebrow">Stage {safeIndex + 1}</p>
              <h2 className="workspace-panel-title mt-3">{currentStage.title}</h2>
              <p className="workspace-panel-subtitle">{currentStage.description}</p>
            </div>
          </header>

          <div className="workspace-panel-body">
            {/* Every stage is rendered; only the current one is shown, so one FormData carries them all. */}

            <div data-stage="business" hidden={currentStage.key !== "business"} className="space-y-5">
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
                    {Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
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
            </div>

            <div data-stage="contacts" hidden={currentStage.key !== "contacts"} className="space-y-6">
              <div className="space-y-5">
                <h3 className="font-heading text-lg">Primary contact</h3>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div><label htmlFor="fullName" className={labelStyles}>Contact name</label><input id="fullName" name="fullName" value={primaryName} onChange={(e) => updatePrimaryName(e.target.value)} required className={fieldStyles} autoComplete="name" /></div>
                  <div><label htmlFor="jobTitle" className={labelStyles}>Job title</label><input id="jobTitle" name="jobTitle" required className={fieldStyles} autoComplete="organization-title" /></div>
                  <div><label htmlFor="email" className={labelStyles}>Email</label><input id="email" name="email" type="email" value={primaryEmail} onChange={(e) => updatePrimaryEmail(e.target.value)} required className={fieldStyles} autoComplete="email" /></div>
                  <div><label htmlFor="telephone" className={labelStyles}>Telephone number</label><input id="telephone" name="telephone" type="tel" required className={fieldStyles} autoComplete="tel" /></div>
                </div>
                <p className={helpTextStyles}>We&apos;ll email a secure, single-use link after your profile is submitted so you can set your password privately.</p>
              </div>
              <div className="space-y-5 border-t border-ink/15 pt-6">
                <h3 className="font-heading text-lg">Billing contact</h3>
                <Check checked={sameContact} onChange={(checked) => { setSameContact(checked); if (checked) { setBillingName(primaryName); setBillingEmail(primaryEmail); } }} label="Same as primary contact" />
                <div className="grid gap-5 sm:grid-cols-2">
                  <div><label htmlFor="billingContactName" className={labelStyles}>Billing contact name</label><input id="billingContactName" name="billingContactName" value={billingName} onChange={(e) => setBillingName(e.target.value)} readOnly={sameContact} required className={fieldStyles} /></div>
                  <div><label htmlFor="billingContactEmail" className={labelStyles}>Billing contact email</label><input id="billingContactEmail" name="billingContactEmail" type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} readOnly={sameContact} required className={fieldStyles} /></div>
                </div>
              </div>
              <div className="space-y-5 border-t border-ink/15 pt-6">
                <div>
                  <h3 className="font-heading text-lg">Compliance manager</h3>
                  <p className={helpTextStyles}>Also called the Business Coach. The weekly compliance report is copied to this person. Optional — leave blank and no copy is sent.</p>
                </div>
                <Check checked={sameCompliance} onChange={(checked) => { setSameCompliance(checked); if (checked) { setComplianceName(primaryName); setComplianceEmail(primaryEmail); } }} label="Same as primary contact" />
                <div className="grid gap-5 sm:grid-cols-2">
                  <div><label htmlFor="complianceManagerName" className={labelStyles}>Compliance manager name <Optional /></label><input id="complianceManagerName" name="complianceManagerName" value={complianceName} onChange={(e) => setComplianceName(e.target.value)} readOnly={sameCompliance} maxLength={120} className={fieldStyles} autoComplete="off" /></div>
                  <div><label htmlFor="complianceManagerEmail" className={labelStyles}>Compliance manager email {complianceName ? null : <Optional />}</label><input id="complianceManagerEmail" name="complianceManagerEmail" type="email" value={complianceEmail} onChange={(e) => setComplianceEmail(e.target.value)} readOnly={sameCompliance} required={Boolean(complianceName)} className={fieldStyles} autoComplete="off" /></div>
                </div>
              </div>
            </div>

            <div data-stage="addresses" hidden={currentStage.key !== "addresses"} className="space-y-6">
              <div className="space-y-5">
                <h3 className="font-heading text-lg">Business address</h3>
                <AddressFields prefix="business" value={businessAddress} onChange={updateBusinessAddress} />
              </div>
              <div className="space-y-5 border-t border-ink/15 pt-6">
                <h3 className="font-heading text-lg">Billing address</h3>
                <Check checked={sameAddress} onChange={(checked) => { setSameAddress(checked); if (checked) setBillingAddress(businessAddress); }} label="Same as business address" />
                <AddressFields prefix="billing" value={billingAddress} onChange={setBillingAddress} readOnly={sameAddress} />
              </div>
              <div className="space-y-5 border-t border-ink/15 pt-6">
                <h3 className="font-heading text-lg">Tax information</h3>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div><label htmlFor="vatStatus" className={labelStyles}>VAT status</label><select id="vatStatus" name="vatStatus" value={vatStatus} onChange={(e) => setVatStatus(e.target.value)} required className={fieldStyles}><option value="">Select VAT status</option><option value="registered">VAT registered</option><option value="not_registered">Not VAT registered</option><option value="pending">Registration pending</option></select></div>
                  {vatStatus === "registered" ? <div><label htmlFor="vatNumber" className={labelStyles}>VAT number</label><input id="vatNumber" name="vatNumber" required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} className={fieldStyles} aria-describedby="vat-help" /><p id="vat-help" className={helpTextStyles}>Enter the 10-digit VAT registration number.</p></div> : <input type="hidden" name="vatNumber" value="" />}
                </div>
              </div>
            </div>

            <div data-stage="package" hidden={currentStage.key !== "package"} className="space-y-5">
              <PackageBuilder packages={packages} lineItems={lineItems} onChange={setSelectedLineItemIds} />
              <p className={helpTextStyles}>The service commencement date is assigned automatically when this package is activated.</p>
              {packages.length === 0 ? <p role="alert" className="border-l-2 border-clay bg-clay/10 px-4 py-3 text-sm text-clay">No active packages are available in the catalogue.</p> : null}
              <div className="border border-ink/25 bg-paper px-4 py-3 text-sm">
                <p className={labelStyles}>Work groups this package draws on</p>
                <p className="mt-1 leading-6 text-ink/70">
                  {applicable.size > 0
                    ? `${stages.filter((stage) => stage.intake && !stage.skipped).map((stage) => stage.title).join(", ")}. Each has a short stage of its own next.`
                    : "None with intake questions yet. The wizard goes straight to files."}
                </p>
              </div>
            </div>

            {/* A skipped group's stage is not rendered at all, so no answers for it are posted. */}
            {stages
              .filter((stage) => stage.intake && !stage.skipped)
              .map((stage) => (
                <div key={stage.key} data-stage={stage.key} hidden={currentStage.key !== stage.key}>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {stage.intake!.fields.map((field) => (
                      <IntakeControl key={field.key} slug={stage.intake!.slug} field={field} />
                    ))}
                  </div>
                  <p className={`${helpTextStyles} mt-6 border-t border-ink/15 pt-4`}>
                    These are the baseline questions inferred for the {stage.title} team. Anything not known now can be left blank and captured later on the customer record.
                  </p>
                </div>
              ))}

            <div data-stage="files" hidden={currentStage.key !== "files"} className="space-y-5">
              <div><label htmlFor="artwork" className={labelStyles}>Customer artwork <Optional /></label><input id="artwork" name="artwork" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className={fileFieldStyles} aria-describedby="artwork-help" /><p id="artwork-help" className={helpTextStyles}>The client&apos;s logo, used as their profile picture. PNG, JPEG, WebP or SVG, up to 10MB.</p></div>
              <div><label htmlFor="purchaseOrder" className={labelStyles}>Purchase order <Optional /></label><input id="purchaseOrder" name="purchaseOrder" type="file" className={fileFieldStyles} aria-describedby="purchase-order-help" /><p id="purchase-order-help" className={helpTextStyles}>Filed into the client&apos;s Purchase Orders folder in their archive. Up to 10MB.</p></div>
              <div><label htmlFor="productList" className={labelStyles}>Client product list <Optional /></label><input id="productList" name="productList" type="file" accept=".xlsx,.xlsm" className={fileFieldStyles} aria-describedby="product-list-help" /><p id="product-list-help" className={helpTextStyles}>What the client sells, at the client&apos;s prices — read into their product list so quotations can be built from it. Excel, up to 5MB. Rows that cannot be read are skipped, and the client can correct them on their Sales tab. <Link href="/api/products/template" prefetch={false} className="border-b border-ink font-semibold hover:border-cobalt hover:text-cobalt">Download the template</Link>.</p></div>
            </div>

            <div data-stage="review" hidden={currentStage.key !== "review"} className="space-y-4">
              {summary.map((section) => (
                <section key={section.stage} className="border border-ink/15 bg-paper">
                  <header className="flex items-center justify-between gap-4 border-b border-ink/10 px-4 py-3">
                    <h3 className="font-heading text-lg">{section.title}</h3>
                    <button type="button" onClick={() => goTo(section.stage as StageKey)} className="text-xs font-semibold text-cobalt hover:underline">
                      Edit
                    </button>
                  </header>
                  <dl className="grid gap-x-6 gap-y-3 px-4 py-4 sm:grid-cols-[minmax(10rem,14rem)_minmax(0,1fr)]">
                    {section.rows.map((row) => (
                      <div key={row.label} className="contents">
                        <dt className="text-xs font-semibold text-ink/60">{row.label}</dt>
                        <dd className="text-sm text-ink">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
              <p className={helpTextStyles}>
                Submitting creates your account and activates the selected package. We&apos;ll email a secure link to set your password before you sign in.
              </p>
            </div>
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-ink/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-4">
              {previous ? (
                <Button type="button" variant="secondary" onClick={() => goTo(previous.key)}>Back</Button>
              ) : (
                <Link href="/dashboard" className={buttonStyles({ variant: "quiet" })}>Cancel</Link>
              )}
            </div>
            <div className="flex items-center gap-3">
              {previous ? <Link href="/dashboard" className={buttonStyles({ variant: "quiet" })}>Cancel</Link> : null}
              {currentStage.key === "review" ? (
                <Button type="submit" disabled={pending || packages.length === 0}>
                  {pending ? "Onboarding…" : "Create client & go live"}
                </Button>
              ) : next ? (
                <Button type="button" onClick={() => goTo(next.key)}>
                  {next.key === "review" ? "Review" : `Next: ${next.title}`}
                </Button>
              ) : null}
            </div>
          </footer>
        </section>

        {state?.error ? (
          <p role="alert" className="mt-5 border border-clay bg-clay/10 px-4 py-3 text-sm text-clay">{state.error}</p>
        ) : null}
      </div>
    </form>
  );
}
