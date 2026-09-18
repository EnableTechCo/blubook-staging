import { describe, expect, it } from "vitest";
import { credentialsSchema } from "@/lib/validation/auth";

describe("credentialsSchema", () => {
  it("accepts a valid email and password", () => {
    expect(credentialsSchema.safeParse({ email: "a@b.com", password: "password1" }).success).toBe(true);
  });

  it("rejects a malformed email", () => {
    expect(credentialsSchema.safeParse({ email: "nope", password: "password1" }).success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(credentialsSchema.safeParse({ email: "a@b.com", password: "short" }).success).toBe(false);
  });
});
