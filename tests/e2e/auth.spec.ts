import { expect, test } from "@playwright/test";

for (const route of [
  { path: "/login", heading: /Welcome back/i },
  { path: "/login/client", heading: /Return to the work already in motion/i },
  { path: "/login/provider", heading: /See the work assigned to your practice/i },
  { path: "/login/staff", heading: /Keep the service network moving/i },
]) {
  test(`${route.path} renders the shared sign-in experience`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    await expect(page.getByRole("link", { name: "Return to website" })).toBeVisible();
    await expect(page.getByText(/create one|remember me|forgot password/i)).toHaveCount(0);
  });
}

test("password visibility control preserves the entered value", async ({ page }) => {
  await page.goto("/login/client");
  const password = page.getByLabel("Password", { exact: true });
  await password.fill("password123");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(password).toHaveValue("password123");
});

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
    await page.getByLabel("Password", { exact: true }).fill(password);
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
