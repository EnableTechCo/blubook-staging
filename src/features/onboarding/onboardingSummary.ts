import { INTAKE_STAGE_BY_SLUG, describeAnswer, intakeFieldName } from "@/features/onboarding/intakeStages";

/**
 * The review stage's content: what the wizard is about to submit, as a person
 * would read it back. Built from the form's own FormData so the review can
 * never disagree with what is posted.
 *
 * Pure, so the tests can hand it a FormData and read the rows.
 */

interface SummaryRow {
  label: string;
  value: string;
}

export interface SummarySection {
  /** The stage key the section belongs to, so "Edit" can jump there. */
  stage: string;
  title: string;
  rows: SummaryRow[];
}

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  private_company: "Private company (Pty) Ltd",
  public_company: "Public company Ltd",
  personal_liability_company: "Personal liability company Inc.",
  non_profit_company: "Non-profit company NPC",
  state_owned_company: "State-owned company SOC Ltd",
  close_corporation: "Close corporation CC",
  cooperative: "Co-operative",
  trust: "Trust",
  sole_proprietor: "Sole proprietor",
  partnership: "Partnership",
  other: "Other",
};

const VAT_LABELS: Record<string, string> = {
  registered: "VAT registered",
  not_registered: "Not VAT registered",
  pending: "Registration pending",
};

const text = (formData: FormData, name: string): string => {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
};

const or = (value: string, fallback = "—") => value || fallback;

function address(formData: FormData, prefix: "business" | "billing"): string {
  return [
    text(formData, `${prefix}AddressLine1`),
    text(formData, `${prefix}AddressLine2`),
    [text(formData, `${prefix}City`), text(formData, `${prefix}Province`)].filter(Boolean).join(", "),
    text(formData, `${prefix}PostalCode`),
    text(formData, `${prefix}Country`),
  ]
    .filter(Boolean)
    .join(", ");
}

function fileName(formData: FormData, name: string): string {
  const value = formData.get(name);
  return value instanceof File && value.size > 0 ? value.name : "Not attached";
}

export function summariseOnboarding(
  formData: FormData,
  ctx: {
    packages: readonly { id: string; name: string; tier: string }[];
    /** The work-group stages that apply, with the group's display name. */
    intakeStages: readonly { slug: string; name: string }[];
  },
): SummarySection[] {
  const packageId = text(formData, "packageId");
  const chosenPackage = ctx.packages.find((pkg) => pkg.id === packageId);
  let lineItemCount = 0;
  try {
    const ids = JSON.parse(text(formData, "lineItemIds") || "[]");
    lineItemCount = Array.isArray(ids) ? ids.length : 0;
  } catch {
    lineItemCount = 0;
  }
  const vatStatus = text(formData, "vatStatus");

  const sections: SummarySection[] = [
    {
      stage: "business",
      title: "Business details",
      rows: [
        { label: "Registered name", value: or(text(formData, "registeredName")) },
        { label: "Trading name", value: or(text(formData, "tradingName")) },
        { label: "Entity type", value: ENTITY_TYPE_LABELS[text(formData, "entityType")] ?? "—" },
        { label: "Registration number", value: or(text(formData, "registrationNumber"), "Not applicable") },
        { label: "Industry", value: or(text(formData, "industry")) },
      ],
    },
    {
      stage: "contacts",
      title: "Contacts",
      rows: [
        {
          label: "Primary contact",
          value: [text(formData, "fullName"), text(formData, "jobTitle")].filter(Boolean).join(" · ") || "—",
        },
        { label: "Email", value: or(text(formData, "email")) },
        { label: "Telephone", value: or(text(formData, "telephone")) },
        {
          label: "Billing contact",
          value:
            [text(formData, "billingContactName"), text(formData, "billingContactEmail")]
              .filter(Boolean)
              .join(" · ") || "—",
        },
        {
          label: "Compliance manager",
          value:
            [text(formData, "complianceManagerName"), text(formData, "complianceManagerEmail")]
              .filter(Boolean)
              .join(" · ") || "None — weekly compliance email not copied",
        },
        { label: "Password", value: text(formData, "password") ? "Set — never shown back to you" : "—" },
      ],
    },
    {
      stage: "addresses",
      title: "Addresses and tax",
      rows: [
        { label: "Business address", value: or(address(formData, "business")) },
        { label: "Billing address", value: or(address(formData, "billing")) },
        { label: "VAT status", value: VAT_LABELS[vatStatus] ?? "—" },
        ...(vatStatus === "registered" ? [{ label: "VAT number", value: or(text(formData, "vatNumber")) }] : []),
      ],
    },
    {
      stage: "package",
      title: "Service package",
      rows: [
        { label: "Package", value: chosenPackage ? `${chosenPackage.name} · ${chosenPackage.tier}` : "—" },
        { label: "Pricing", value: text(formData, "packageMode") === "flex" ? "Flex — priced per line item" : "Standard" },
        { label: "Line items", value: String(lineItemCount) },
      ],
    },
  ];

  for (const { slug, name } of ctx.intakeStages) {
    const stage = INTAKE_STAGE_BY_SLUG.get(slug);
    if (!stage) continue;
    sections.push({
      stage: `intake:${slug}`,
      title: name,
      rows: stage.fields.map((field) => ({
        label: field.label,
        value: describeAnswer(field, text(formData, intakeFieldName(slug, field.key)) || undefined),
      })),
    });
  }

  sections.push({
    stage: "files",
    title: "Files",
    rows: [
      { label: "Customer artwork", value: fileName(formData, "artwork") },
      { label: "Purchase order", value: fileName(formData, "purchaseOrder") },
      { label: "Client product list", value: fileName(formData, "productList") },
    ],
  });

  return sections;
}
