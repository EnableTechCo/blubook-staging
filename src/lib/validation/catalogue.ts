import { z } from "zod";

export const BILLING_INTERVALS = ["monthly", "quarterly", "annual", "one_time"] as const;
export const SERVICE_TIERS = ["basic", "intermediate", "professional"] as const;

/** Normalise a display name into a stable, URL-safe slug. */
export function toPackageSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const packageSchema = z.object({
  name: z.string().trim().min(1, "A package needs a name").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "A package needs a slug")
    .max(120)
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Slug must be lowercase letters, numbers and single hyphens",
    ),
  tier: z.enum(SERVICE_TIERS),
  billingInterval: z.enum(BILLING_INTERVALS),
  // Entered in rands; the column is numeric so there is no float rounding.
  price: z
    .number({ error: "Enter a price" })
    .nonnegative("Price cannot be negative")
    .max(99_999_999),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  lineItemIds: z.array(z.string().uuid()).default([]),
});

export type PackageInput = z.infer<typeof packageSchema>;

export const FULFILMENT_MODES = ["service_request", "automatic"] as const;

export const lineItemSchema = z.object({
  serviceId: z.string().uuid("Choose a service"),
  name: z.string().trim().min(1, "A line item needs a name").max(200),
  tier: z.enum(SERVICE_TIERS),
  fulfilmentMode: z.enum(FULFILMENT_MODES),
  price: z
    .number({ error: "Enter a price" })
    .nonnegative("Price cannot be negative")
    .max(99_999_999),
});

export type LineItemInput = z.infer<typeof lineItemSchema>;
