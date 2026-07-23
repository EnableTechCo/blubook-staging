import { describe, expect, it } from "vitest";
import { credentialsSchema, signUpSchema } from "@/lib/validation/auth";

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

describe("signUpSchema", () => {
  it("accepts a full signup payload", () => {
    const result = signUpSchema.safeParse({ email: "a@b.com", password: "password1", fullName: "Ada" });
    expect(result.success).toBe(true);
  });

  it("requires a non-empty name", () => {
    expect(
      signUpSchema.safeParse({ email: "a@b.com", password: "password1", fullName: "   " }).success,
    ).toBe(false);
  });
});
