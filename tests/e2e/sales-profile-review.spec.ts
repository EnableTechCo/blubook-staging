import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const enabled = process.env.RUN_ONBOARDING_E2E === "1"
  && process.env.ONBOARDING_E2E_DEDICATED_PROJECT === "1"
  && process.env.ONBOARDING_E2E_ALLOW_MUTATIONS === "1"
  && process.env.NEXT_PUBLIC_ENVIRONMENT !== "production";
const salesEmail = process.env.ONBOARDING_E2E_SALES_EMAIL;
const salesPassword = process.env.ONBOARDING_E2E_SALES_PASSWORD;
const supabaseUrl = process.env.ONBOARDING_E2E_SUPABASE_URL;
const serviceRoleKey = process.env.ONBOARDING_E2E_SUPABASE_SERVICE_ROLE_KEY;

test("Sales can request changes, edit a customer profile, and approve it with an audit trail", async ({ page }) => {
  test.skip(
    !enabled || !salesEmail || !salesPassword || !supabaseUrl || !serviceRoleKey,
    "requires an explicitly designated disposable E2E Supabase project and a Sales account",
  );

  const admin = createClient<any>(supabaseUrl!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const marker = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const customerEmail = `profile-review-${marker}@example.test`;
  const businessName = `Review E2E ${marker}`;
  let customerId: string | undefined;
  let clientId: string | undefined;

  try {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: customerEmail,
      password: `E2E-only-${marker}-Password!`,
      email_confirm: true,
      user_metadata: { user_type: "client", full_name: `Review E2E ${marker}` },
    });
    if (createError || !created.user) throw createError ?? new Error("Could not seed E2E customer");
    customerId = created.user.id;

    const { data: client, error: clientError } = await admin.from("clients").insert({
      business_name: businessName,
      registered_name: businessName,
      trading_name: businessName,
      entity_type: "private_company",
      industry: "E2E test industry",
      primary_profile_id: customerId,
      status: "active",
    }).select("id").single();
    if (clientError || !client) throw clientError ?? new Error("Could not seed E2E client");
    clientId = client.id;

    const { error: onboardingError } = await admin.from("onboardings").insert({
      client_id: clientId,
      status: "awaiting_documents",
      sales_review_status: "awaiting_review",
    });
    if (onboardingError) throw onboardingError;

    await page.goto("/login/staff");
    await page.getByLabel("Email").fill(salesEmail!);
    await page.getByLabel("Password", { exact: true }).fill(salesPassword!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto("/dashboard/onboardings");

    const customerCase = page.locator("article").filter({ hasText: businessName });
    await expect(customerCase).toContainText("Awaiting Sales review");
    await customerCase.getByLabel("Message to customer").fill("Please confirm your industry classification.");
    await customerCase.getByRole("button", { name: /request changes/i }).click();
    await expect(customerCase).toContainText("Changes requested");

    await customerCase.getByRole("button", { name: /edit profile/i }).click();
    await customerCase.getByLabel("Industry").fill("E2E reviewed industry");
    await customerCase.getByRole("button", { name: /save profile/i }).click();
    await expect(customerCase).toContainText("Profile saved");
    await customerCase.getByRole("button", { name: /approve profile/i }).click();
    await expect(customerCase).toContainText("Profile approved");
    await expect(customerCase).toContainText("Approved by Sales");

    const { data: audit, error: auditError } = await admin
      .from("onboarding_audit_events")
      .select("event_type,changed_fields")
      .eq("client_id", clientId);
    if (auditError) throw auditError;
    expect(audit?.map((event: { event_type: string }) => event.event_type)).toEqual(
      expect.arrayContaining(["changes_requested", "profile_updated", "approved"]),
    );
    expect(audit?.find((event: { event_type: string }) => event.event_type === "profile_updated")?.changed_fields)
      .toContain("industry");

    const { data: savedClient, error: savedClientError } = await admin
      .from("clients")
      .select("industry,profile_version")
      .eq("id", clientId)
      .single();
    if (savedClientError) throw savedClientError;
    expect(savedClient).toMatchObject({ industry: "E2E reviewed industry", profile_version: 2 });
  } finally {
    if (clientId) await admin.from("clients").delete().eq("id", clientId);
    if (customerId) await admin.auth.admin.deleteUser(customerId);
  }
});
