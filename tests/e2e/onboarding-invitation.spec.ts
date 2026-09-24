import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

test("public signup without an invitation cannot create a client account", async ({ page }) => {
  await page.goto("/signup");

  await expect(page.getByRole("heading", { name: /invitation required/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /create my account/i })).toHaveCount(0);
  await expect(page.getByLabel("Account password")).toHaveCount(0);
});

const onboardingEnabled = process.env.RUN_ONBOARDING_E2E === "1"
  && process.env.ONBOARDING_E2E_DEDICATED_PROJECT === "1"
  && process.env.ONBOARDING_E2E_ALLOW_MUTATIONS === "1"
  && process.env.NEXT_PUBLIC_ENVIRONMENT !== "production";
const salesEmail = process.env.ONBOARDING_E2E_SALES_EMAIL;
const salesPassword = process.env.ONBOARDING_E2E_SALES_PASSWORD;
const mailSink = process.env.ONBOARDING_E2E_MAIL_SINK_URL ?? "http://127.0.0.1:4321";
const supabaseUrl = process.env.ONBOARDING_E2E_SUPABASE_URL;
const serviceRoleKey = process.env.ONBOARDING_E2E_SUPABASE_SERVICE_ROLE_KEY;

test.describe("invited client onboarding", () => {
  test.skip(
    !onboardingEnabled || !salesEmail || !salesPassword || !supabaseUrl || !serviceRoleKey,
    "requires an explicitly designated disposable E2E Supabase project and a Sales account",
  );

  test("invited onboarding provisions a partial account, then securely sets credentials with Finance locked", async ({ browser, page, request }) => {
    const marker = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const customerEmail = `onboarding-e2e-${marker}@example.test`;
    let customerPage: typeof page | undefined;

    try {
      await page.goto("/login/staff");
      await page.getByLabel("Email").fill(salesEmail!);
      await page.getByLabel("Password", { exact: true }).fill(salesPassword!);
      await page.getByRole("button", { name: "Sign in" }).click();
      await expect(page).toHaveURL(/\/dashboard/);

      await page.goto("/dashboard/onboardings");
      await page.getByLabel(/customer email/i).fill(customerEmail);
      await page.getByRole("button", { name: /send invitation/i }).click();
      await expect(page.getByRole("status")).toContainText(/invitation email will arrive/i);

      let invitation: { template_params?: Record<string, string> } | undefined;
      await expect.poll(async () => {
        const response = await request.get(`${mailSink}/messages?to_email=${encodeURIComponent(customerEmail)}`);
        if (!response.ok()) return undefined;
        const messages = (await response.json()) as { template_params?: Record<string, string> }[];
        invitation = messages.at(-1);
        return invitation?.template_params?.invite_url;
      }).toBeTruthy();

      const invitationLink = invitation?.template_params?.invite_url;
      expect(invitationLink).toBeTruthy();
      const customerContext = await browser.newContext();
      customerPage = await customerContext.newPage();
      await customerPage.goto(invitationLink!);
      await expect(customerPage.locator("[data-invitation-form]")).toBeVisible();

      // Complete each visible stage using deterministic, non-sensitive values.
      for (let stageIndex = 0; stageIndex < 16; stageIndex += 1) {
        const stage = customerPage.locator("[data-stage]:not([hidden])").first();
        const currentStage = await stage.getAttribute("data-stage");
        if (currentStage === "review") break;

        const requiredInputs = stage.locator("input[required]:visible, textarea[required]:visible");
        for (const input of await requiredInputs.all()) {
          const id = await input.getAttribute("id");
          const type = await input.getAttribute("type");
          const readonly = await input.getAttribute("readonly");
          if (readonly) continue;
          if (type === "email" || id === "email") await input.fill(customerEmail);
          else if (type === "tel") await input.fill("+27115550123");
          else if (id?.toLowerCase().includes("postalcode")) await input.fill("2196");
          else if (id === "registrationNumber") await input.fill("20260924000123");
          else await input.fill(`E2E ${id ?? "value"} ${marker}`);
        }

        for (const select of await stage.locator("select[required]:visible").all()) {
          const value = await select.locator("option:not([value=''])").first().getAttribute("value");
          if (value) await select.selectOption(value);
        }

        await customerPage.getByRole("button", { name: /^Next:/ }).click();
      }

      await expect(customerPage.locator('[data-stage="review"]')).toBeVisible();
      await customerPage.getByRole("button", { name: /create my account/i }).click();
      await expect(customerPage).toHaveURL(/\/login\?accountCreated=1/);
      const setupResponse = await request.get(mailSink + "/messages?to_email=" + encodeURIComponent(customerEmail));
      const setupMessages = (await setupResponse.json()) as { template_params?: Record<string, string> }[];
      const setupLink = setupMessages.map((message) => message.template_params?.setup_url).find(Boolean);
      expect(setupLink).toBeTruthy();
      await customerPage.goto(setupLink!);
      await expect(customerPage.getByRole("heading", { name: /choose your password/i })).toBeVisible();
      const password = "Repeatable-E2E-pass-2026!";
      await customerPage.getByLabel("New password", { exact: true }).fill(password);
      await customerPage.getByLabel("Confirm password", { exact: true }).fill(password);
      await customerPage.getByRole("button", { name: /continue to dashboard/i }).click();
      await expect(customerPage).toHaveURL(/\/dashboard\?accountCreated=1/);
      await expect(customerPage.getByRole("heading", { name: /finance services pending/i })).toBeVisible();
      await expect(customerPage.getByRole("link", { name: "Sales" })).toBeVisible();
      await expect(customerPage.getByRole("link", { name: "Transact" })).toBeVisible();
      await expect(customerPage.getByText("Separate finance onboarding required")).toBeVisible();
    } finally {
      if (customerPage) await customerPage.context().close();
      // Cleanup is restricted to the uniquely named synthetic E2E account and
      // only runs when the dedicated, explicitly-mutation-enabled project gate passed.
      if (onboardingEnabled && supabaseUrl && serviceRoleKey) {
        const cleanup = createClient<any>(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const { data: profile, error: profileError } = await cleanup
          .from("profiles")
          .select("id")
          .eq("email", customerEmail)
          .maybeSingle();
        if (profileError) throw profileError;
        if (profile) {
          const { data: clients, error: clientsError } = await cleanup
            .from("clients")
            .select("id")
            .eq("primary_profile_id", profile.id);
          if (clientsError) throw clientsError;
          for (const client of clients ?? []) {
            const { data: files, error: filesError } = await cleanup.storage
              .from("documents")
              .list(client.id, { limit: 1000 });
            if (filesError) throw filesError;
            if (files?.length) {
              const { error } = await cleanup.storage.from("documents")
                .remove(files.map((file) => `${client.id}/${file.name}`));
              if (error) throw error;
            }
            const { error } = await cleanup.from("clients").delete().eq("id", client.id);
            if (error) throw error;
          }
          const { error } = await cleanup.auth.admin.deleteUser(profile.id);
          if (error) throw error;
        }
        const { error: invitesError } = await cleanup
          .from("onboarding_invites")
          .delete()
          .eq("email", customerEmail);
        if (invitesError) throw invitesError;
        const mailCleanup = await request.delete(`${mailSink}/messages?to_email=${encodeURIComponent(customerEmail)}`);
        if (!mailCleanup.ok()) throw new Error("Could not remove synthetic E2E emails");
      }
    }
  });
});
