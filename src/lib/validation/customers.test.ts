import { describe, expect, it } from "vitest";
import { complianceContactSchema } from "@/lib/validation/customers";

// The pair is optional together, but a name without an email is a contact the
// weekly compliance email cannot reach, so the email is required with a name.

describe("complianceContactSchema", () => {
  it("accepts both blank, which switches the weekly copy off", () => {
    const out = complianceContactSchema.safeParse({ complianceManagerName: "", complianceManagerEmail: "" });
    expect(out.success).toBe(true);
    expect(out.data).toEqual({ complianceManagerName: undefined, complianceManagerEmail: undefined });
  });

  it("accepts an email on its own, and trims a name", () => {
    const out = complianceContactSchema.safeParse({
      complianceManagerName: "  Thabo Nkosi ",
      complianceManagerEmail: "thabo@coach.test",
    });
    expect(out.success && out.data).toEqual({
      complianceManagerName: "Thabo Nkosi",
      complianceManagerEmail: "thabo@coach.test",
    });
    expect(complianceContactSchema.safeParse({ complianceManagerEmail: "coach@example.test" }).success).toBe(true);
  });

  it("refuses a name without an email, and names the field", () => {
    const out = complianceContactSchema.safeParse({ complianceManagerName: "Thabo Nkosi", complianceManagerEmail: "" });
    expect(out.success).toBe(false);
    expect(out.error?.issues[0]?.path).toEqual(["complianceManagerEmail"]);
    expect(out.error?.issues[0]?.message).toMatch(/email/);
  });

  it("refuses an email that is not one", () => {
    const out = complianceContactSchema.safeParse({ complianceManagerEmail: "not-an-email" });
    expect(out.success).toBe(false);
    expect(out.error?.issues[0]?.message).toBe("Enter a valid compliance manager email address");
  });
});
