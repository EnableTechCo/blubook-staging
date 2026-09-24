import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results",
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node tests/e2e/support/mail-sink.mjs",
      url: "http://127.0.0.1:4321/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: "pnpm dev",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        EMAILJS_TEST_ENDPOINT: "http://127.0.0.1:4321/api/v1.0/email/send",
        EMAILJS_SERVICE_ID: "e2e-service",
        EMAILJS_PUBLIC_KEY: "e2e-public-key",
        EMAILJS_PRIVATE_KEY: "e2e-private-key",
        EMAILJS_TEMPLATE_ONBOARDING_INVITE: "e2e-invite",
        EMAILJS_TEMPLATE_CREDENTIAL_SETUP: "e2e-credential-setup",
      },
    },
  ],
});
