import { expect, test } from "@playwright/test";

test("health endpoint reports ready", async ({ request }) => {
  const response = await request.get("/api/health");
  await expect(response).toBeOK();
  await expect(response.json()).resolves.toMatchObject({ status: "ok", service: "blubook" });
});
