/**
 * The work-group stages of the onboarding wizard.
 *
 * Onboarding is one wizard: the client's own details first, then one stage per
 * work group the chosen package draws on, each asking what that group needs to
 * know at a baseline before it can serve the client. The groups have not yet
 * settled their questions, so what is here is inferred from what each group
 * does — enough for Finance to start a month-end, Tender Services to assess a
 * first bid, Logistics to plan a first collection. It is a starting point to be
 * corrected by the groups, which is why every field carries its own label and
 * the answers are stored as a document keyed by these `key`s: a question can be
 * reworded, added or dropped here without touching the database.
 *
 * Pure: no React, no Supabase. The wizard renders it, the action parses form
 * data against it, and the tests read it directly.
 */

type IntakeFieldType = "text" | "number" | "select" | "textarea" | "date" | "url";

export interface IntakeField {
  /** Stable key the answer is stored under. Never reuse a key for a different question. */
  key: string;
  label: string;
  type: IntakeFieldType;
  /** For `select`: the choices, in display order. The stored answer is the option's value. */
  options?: readonly { value: string; label: string }[];
  help?: string;
  placeholder?: string;
  required?: boolean;
}

export interface IntakeStage {
  /** The work group's slug in service_groups. The stage is shown when the package touches this group. */
  slug: string;
  /** What the group needs, in one sentence — shown under the stage title. */
  purpose: string;
  fields: IntakeField[];
}

const yesNo = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
] as const;

const yesNoPartly = [
  { value: "yes", label: "Yes" },
  { value: "partly", label: "Partly" },
  { value: "no", label: "No" },
] as const;

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
].map((month) => ({ value: month.toLowerCase(), label: month }));

const headcountBands = [
  { value: "1-5", label: "1 – 5" },
  { value: "6-20", label: "6 – 20" },
  { value: "21-50", label: "21 – 50" },
  { value: "51-200", label: "51 – 200" },
  { value: "200+", label: "More than 200" },
] as const;

const randBands = [
  { value: "under-250k", label: "Under R250 000" },
  { value: "250k-1m", label: "R250 000 – R1 million" },
  { value: "1m-5m", label: "R1 million – R5 million" },
  { value: "5m-20m", label: "R5 million – R20 million" },
  { value: "20m+", label: "More than R20 million" },
] as const;

const volumeBands = [
  { value: "under-50", label: "Under 50" },
  { value: "50-250", label: "50 – 250" },
  { value: "250-1000", label: "250 – 1 000" },
  { value: "1000+", label: "More than 1 000" },
] as const;

/**
 * The stages, in the order they appear after the client's own details. A group
 * with no entry here still exists in the catalogue; the wizard simply has no
 * questions for it yet and skips the stage.
 */
export const INTAKE_STAGES: IntakeStage[] = [
  {
    slug: "finance",
    purpose: "What the Finance team needs before the first month-end.",
    fields: [
      {
        key: "accounting_system",
        label: "Accounting system in use",
        type: "select",
        required: true,
        options: [
          { value: "sage", label: "Sage" },
          { value: "xero", label: "Xero" },
          { value: "greatsoft", label: "GreatSoft" },
          { value: "pastel", label: "Pastel" },
          { value: "quickbooks", label: "QuickBooks" },
          { value: "spreadsheets", label: "Spreadsheets only" },
          { value: "none", label: "None yet" },
          { value: "other", label: "Other" },
        ],
      },
      { key: "financial_year_end", label: "Financial year end", type: "select", options: months, required: true },
      {
        key: "bookkeeping_frequency",
        label: "How often the books are brought up to date",
        type: "select",
        options: [
          { value: "weekly", label: "Weekly" },
          { value: "monthly", label: "Monthly" },
          { value: "quarterly", label: "Quarterly" },
          { value: "annually", label: "Annually, at year end" },
        ],
      },
      { key: "monthly_transactions", label: "Transactions in a typical month", type: "select", options: volumeBands },
      { key: "annual_turnover", label: "Annual turnover", type: "select", options: randBands },
      { key: "bank", label: "Primary bank", type: "text", placeholder: "e.g. FNB, Standard Bank, Nedbank" },
      { key: "existing_accountant", label: "Current accountant or auditor", type: "text", help: "Leave blank if none." },
      { key: "efiling_access", label: "SARS eFiling access can be shared", type: "select", options: yesNo },
      { key: "notes", label: "Anything else Finance should know", type: "textarea" },
    ],
  },
  {
    slug: "human-resources",
    purpose: "What Human Resources needs before the first payroll run.",
    fields: [
      { key: "headcount", label: "Number of employees", type: "select", options: headcountBands, required: true },
      {
        key: "payroll_frequency",
        label: "Payroll frequency",
        type: "select",
        options: [
          { value: "monthly", label: "Monthly" },
          { value: "fortnightly", label: "Fortnightly" },
          { value: "weekly", label: "Weekly" },
          { value: "none", label: "No payroll yet" },
        ],
      },
      { key: "payroll_system", label: "Payroll system or provider", type: "text", placeholder: "e.g. Sage Payroll, SimplePay, outsourced" },
      { key: "paye_uif_sdl_registered", label: "Registered for PAYE, UIF and SDL", type: "select", options: yesNoPartly },
      { key: "bargaining_council", label: "Bargaining council or sectoral determination", type: "text", help: "Leave blank if none applies." },
      { key: "policies_in_place", label: "Employment contracts and HR policies in place", type: "select", options: yesNoPartly },
      { key: "hr_contact", label: "Day-to-day HR contact", type: "text", help: "Name, if different from the primary contact." },
      { key: "notes", label: "Anything else Human Resources should know", type: "textarea" },
    ],
  },
  {
    slug: "marketing",
    purpose: "What Marketing needs before the first campaign.",
    fields: [
      { key: "website", label: "Website", type: "url", placeholder: "https://" },
      { key: "social_handles", label: "Social media accounts", type: "text", placeholder: "e.g. @ridgefoods on Instagram and LinkedIn" },
      { key: "brand_assets", label: "Logo files and brand guidelines available", type: "select", options: yesNoPartly, required: true },
      { key: "target_market", label: "Who the client sells to", type: "textarea", placeholder: "Customer types, regions, sectors." },
      {
        key: "primary_channel",
        label: "Channel that matters most right now",
        type: "select",
        options: [
          { value: "social", label: "Social media" },
          { value: "search", label: "Search and website" },
          { value: "email", label: "Email and CRM" },
          { value: "print", label: "Print and events" },
          { value: "undecided", label: "Not decided" },
        ],
      },
      { key: "monthly_budget", label: "Monthly marketing budget", type: "select", options: randBands },
      { key: "notes", label: "Anything else Marketing should know", type: "textarea" },
    ],
  },
  {
    slug: "logistics",
    purpose: "What Logistics needs before the first collection or delivery.",
    fields: [
      {
        key: "premises",
        label: "Storage premises",
        type: "select",
        required: true,
        options: [
          { value: "own-warehouse", label: "Own warehouse" },
          { value: "rented-warehouse", label: "Rented warehouse" },
          { value: "third-party", label: "Third-party storage" },
          { value: "none", label: "No storage" },
        ],
      },
      { key: "locations", label: "Number of locations served", type: "number", placeholder: "1" },
      { key: "monthly_shipments", label: "Shipments in a typical month", type: "select", options: volumeBands },
      { key: "carriers", label: "Carriers or couriers in use", type: "text" },
      { key: "inventory_system", label: "Inventory or stock system", type: "text", placeholder: "e.g. Sage Inventory, spreadsheets" },
      { key: "delivery_regions", label: "Regions delivered to", type: "text", placeholder: "e.g. Gauteng and KwaZulu-Natal" },
      { key: "notes", label: "Anything else Logistics should know", type: "textarea" },
    ],
  },
  {
    slug: "tender-services",
    purpose: "What Tender Services needs before assessing the first bid.",
    fields: [
      { key: "csd_number", label: "Central Supplier Database (CSD) number", type: "text", placeholder: "MAAA…", help: "Leave blank if not yet registered." },
      {
        key: "bbbee_level",
        label: "B-BBEE status",
        type: "select",
        required: true,
        options: [
          ...[1, 2, 3, 4, 5, 6, 7, 8].map((level) => ({ value: `level-${level}`, label: `Level ${level}` })),
          { value: "non-compliant", label: "Non-compliant" },
          { value: "exempt", label: "Exempted micro enterprise" },
          { value: "unknown", label: "Not yet assessed" },
        ],
      },
      { key: "tax_pin", label: "SARS tax compliance PIN available", type: "select", options: yesNo },
      { key: "cidb_grade", label: "CIDB grading", type: "text", help: "Construction only. Leave blank otherwise." },
      { key: "sectors", label: "Sectors and buyers of interest", type: "textarea", placeholder: "e.g. municipal catering, provincial health supplies" },
      { key: "tender_experience", label: "Tenders submitted before", type: "select", options: yesNo },
      { key: "notes", label: "Anything else Tender Services should know", type: "textarea" },
    ],
  },
  {
    slug: "capital",
    purpose: "What Capital needs before scoping a funding conversation.",
    fields: [
      {
        key: "funding_need",
        label: "Funding need",
        type: "select",
        required: true,
        options: [
          { value: "working-capital", label: "Working capital" },
          { value: "asset-finance", label: "Asset or equipment finance" },
          { value: "expansion", label: "Expansion or growth" },
          { value: "bridging", label: "Bridging or contract finance" },
          { value: "none", label: "None at present" },
        ],
      },
      { key: "amount", label: "Amount being considered", type: "select", options: randBands },
      { key: "timeframe", label: "When the funding is needed", type: "date" },
      { key: "existing_facilities", label: "Existing lenders and facilities", type: "text", help: "Leave blank if none." },
      { key: "financials_available", label: "Financial statements for the last two years available", type: "select", options: yesNoPartly },
      { key: "security", label: "Security or collateral available", type: "select", options: yesNoPartly },
      { key: "notes", label: "Anything else Capital should know", type: "textarea" },
    ],
  },
  {
    slug: "customer-care",
    purpose: "What Customer Care needs before taking the first call.",
    fields: [
      {
        key: "channels",
        label: "How customers currently reach the client",
        type: "select",
        required: true,
        options: [
          { value: "phone", label: "Telephone" },
          { value: "email", label: "Email" },
          { value: "whatsapp", label: "WhatsApp" },
          { value: "web", label: "Website or live chat" },
          { value: "mixed", label: "A mix of these" },
        ],
      },
      { key: "monthly_volume", label: "Enquiries in a typical month", type: "select", options: volumeBands },
      { key: "service_hours", label: "Service hours", type: "text", placeholder: "e.g. Weekdays 08:00 – 17:00" },
      { key: "helpdesk_system", label: "Helpdesk or CRM system", type: "text", help: "Leave blank if none." },
      { key: "escalation_contact", label: "Escalation contact", type: "text", help: "Name and email of who handles a complaint." },
      {
        key: "response_expectation",
        label: "Expected first response time",
        type: "select",
        options: [
          { value: "1h", label: "Within an hour" },
          { value: "same-day", label: "Same business day" },
          { value: "24h", label: "Within 24 hours" },
          { value: "48h", label: "Within two business days" },
        ],
      },
      { key: "notes", label: "Anything else Customer Care should know", type: "textarea" },
    ],
  },
];

export const INTAKE_STAGE_BY_SLUG: ReadonlyMap<string, IntakeStage> = new Map(
  INTAKE_STAGES.map((stage) => [stage.slug, stage]),
);

/** The form field name an answer is posted under. */
export function intakeFieldName(slug: string, key: string): string {
  return `intake[${slug}][${key}]`;
}

const FIELD_NAME = /^intake\[([a-z0-9-]+)\]\[([a-z0-9_]+)\]$/;

export type IntakeAnswers = Record<string, Record<string, string>>;

/**
 * Reads every `intake[slug][key]` entry off the form into answers by slug.
 * Blank answers are dropped, and so is any slug without a stage or any key a
 * stage does not define — a stale or hand-crafted field name is not an answer.
 * Slugs with nothing left are omitted, so a group the package does not touch
 * gets no row at all.
 */
export function parseIntakeAnswers(formData: FormData): IntakeAnswers {
  const answers: IntakeAnswers = {};
  for (const [name, value] of formData.entries()) {
    const match = FIELD_NAME.exec(name);
    if (!match || typeof value !== "string") continue;
    const [, slug, key] = match;
    const stage = INTAKE_STAGE_BY_SLUG.get(slug);
    if (!stage || !stage.fields.some((field) => field.key === key)) continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    (answers[slug] ??= {})[key] = trimmed.slice(0, 2000);
  }
  return answers;
}

/**
 * The first problem with a set of answers for the stages that apply, or null.
 * Required fields must be present, and a select's answer must be one of its
 * options. Only the stages in `applicable` are checked: an answer for a stage
 * the package does not touch is ignored rather than refused.
 */
export function intakeProblem(answers: IntakeAnswers, applicable: readonly string[]): string | null {
  for (const slug of applicable) {
    const stage = INTAKE_STAGE_BY_SLUG.get(slug);
    if (!stage) continue;
    const given = answers[slug] ?? {};
    for (const field of stage.fields) {
      const value = given[field.key];
      if (field.required && !value) return `${field.label} is required.`;
      if (value && field.type === "select" && !field.options?.some((option) => option.value === value)) {
        return `${field.label}: choose one of the listed options.`;
      }
      if (value && field.type === "number" && !/^\d{1,9}$/.test(value)) {
        return `${field.label} must be a whole number.`;
      }
    }
  }
  return null;
}

/**
 * The work groups a package assembly draws on, in stage order: the distinct
 * group slugs of the chosen line items, keeping only those the wizard has a
 * stage for. This is what decides which intake stages a client sees.
 */
export function applicableIntakeStages(
  selectedLineItemIds: readonly string[],
  lineItems: readonly { id: string; workGroupSlug: string | null }[],
): IntakeStage[] {
  const chosen = new Set(selectedLineItemIds);
  const slugs = new Set<string>();
  for (const item of lineItems) {
    if (chosen.has(item.id) && item.workGroupSlug) slugs.add(item.workGroupSlug);
  }
  return INTAKE_STAGES.filter((stage) => slugs.has(stage.slug));
}

/** An answer as a person would read it: the option's label for a select, the value otherwise. */
export function describeAnswer(field: IntakeField, value: string | undefined): string {
  if (!value) return "—";
  if (field.type === "select") return field.options?.find((option) => option.value === value)?.label ?? value;
  return value;
}
