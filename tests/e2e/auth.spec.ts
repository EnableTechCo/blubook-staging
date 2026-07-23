import { expect, test } from "@playwright/test";

// Runs everywhere: no session means protected routes bounce to /login. Works
// even when the auth server is unreachable, because middleware fails closed.
test("unauthenticated dashboard access redirects to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login(\?|$)/);
});

// Full round-trip against a live Supabase. Opt-in via RUN_AUTH_E2E=1 because
// CI does not provision an auth server.
test.describe("auth round-trip", () => {
  test.skip(process.env.RUN_AUTH_E2E !== "1", "requires a live Supabase (set RUN_AUTH_E2E=1)");

  test("sign up, view dashboard, sign out, sign back in", async ({ page }) => {
    const email = `e2e_${Date.now()}@test.local`;
    const password = "password123";

    await page.goto("/signup");
    await page.getByLabel("Full name").fill("E2E User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: "E2E User" })).toBeVisible();
    await expect(page.getByText("Client")).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
