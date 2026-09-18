import { describe, expect, it } from "vitest";
import { intakeFieldName } from "@/features/onboarding/intakeStages";
import { summariseOnboarding } from "@/features/onboarding/onboardingSummary";

const form = (entries: Record<string, string | File>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
};

const packages = [{ id: "pkg-1", name: "Foundation", tier: "basic" }];

describe("summariseOnboarding", () => {
  it("reads the client's details back in stage order, labelled as a person would say them", () => {
    const fd = form({
      registeredName: "Ridge Foods (Pty) Ltd",
      tradingName: "Ridge",
      entityType: "private_company",
      registrationNumber: "2019/123456/07",
      industry: "Hospitality",
      fullName: "Naledi Dlamini",
      jobTitle: "Owner",
      email: "naledi@ridge.test",
      telephone: "0110000000",
      billingContactName: "Naledi Dlamini",
      billingContactEmail: "naledi@ridge.test",
      complianceManagerName: "Thabo Nkosi",
      complianceManagerEmail: "thabo@coach.test",
      password: "fixture-private-value",
      businessAddressLine1: "1 Main Rd",
      businessCity: "Sandton",
      businessProvince: "Gauteng",
      businessPostalCode: "2196",
      businessCountry: "South Africa",
      vatStatus: "registered",
      vatNumber: "4123456789",
      packageMode: "flex",
      packageId: "pkg-1",
      lineItemIds: JSON.stringify(["a", "b", "c"]),
    });

    const sections = summariseOnboarding(fd, { packages, intakeStages: [] });

    expect(sections.map((s) => s.stage)).toEqual(["business", "contacts", "addresses", "package", "files"]);
    const rows = Object.fromEntries(sections.flatMap((s) => s.rows.map((r) => [`${s.stage}/${r.label}`, r.value])));
    expect(rows["business/Entity type"]).toBe("Private company (Pty) Ltd");
    expect(rows["contacts/Primary contact"]).toBe("Naledi Dlamini · Owner");
    expect(rows["contacts/Compliance manager"]).toBe("Thabo Nkosi · thabo@coach.test");
    expect(rows["contacts/Account password"]).toMatch(/^Set/);
    expect(rows["contacts/Account password"]).not.toContain("fixture-private-value");
    expect(rows["addresses/Business address"]).toBe("1 Main Rd, Sandton, Gauteng, 2196, South Africa");
    expect(rows["addresses/Billing address"]).toBe("—");
    expect(rows["addresses/VAT number"]).toBe("4123456789");
    expect(rows["package/Package"]).toBe("Foundation · basic");
    expect(rows["package/Pricing"]).toBe("Flex — priced per line item");
    expect(rows["package/Line items"]).toBe("3");
    expect(rows["files/Customer artwork"]).toBe("Not attached");
  });

  it("says plainly when no compliance manager was given", () => {
    const sections = summariseOnboarding(form({}), { packages, intakeStages: [] });
    const contacts = sections.find((s) => s.stage === "contacts")!;
    expect(contacts.rows.find((r) => r.label === "Compliance manager")?.value).toBe(
      "None — weekly compliance email not copied",
    );
  });

  it("omits the VAT number row unless the client is registered", () => {
    const sections = summariseOnboarding(form({ vatStatus: "not_registered" }), { packages, intakeStages: [] });
    const addresses = sections.find((s) => s.stage === "addresses")!;
    expect(addresses.rows.map((r) => r.label)).not.toContain("VAT number");
    expect(addresses.rows.find((r) => r.label === "VAT status")?.value).toBe("Not VAT registered");
  });

  it("adds one section per applicable work group, with select answers as labels", () => {
    const fd = form({
      [intakeFieldName("finance", "accounting_system")]: "greatsoft",
      [intakeFieldName("finance", "bank")]: "Nedbank",
    });
    const sections = summariseOnboarding(fd, {
      packages,
      intakeStages: [{ slug: "finance", name: "Finance" }, { slug: "capital", name: "Capital" }],
    });
    expect(sections.map((s) => s.stage)).toEqual([
      "business", "contacts", "addresses", "package", "intake:finance", "intake:capital", "files",
    ]);
    const finance = sections.find((s) => s.stage === "intake:finance")!;
    expect(finance.title).toBe("Finance");
    expect(finance.rows.find((r) => r.label === "Accounting system in use")?.value).toBe("GreatSoft");
    expect(finance.rows.find((r) => r.label === "Primary bank")?.value).toBe("Nedbank");
    expect(finance.rows.find((r) => r.label === "Financial year end")?.value).toBe("—");
  });

  it("names attached files and tolerates a broken line item list", () => {
    const fd = form({
      artwork: new File([new Uint8Array(4)], "logo.png", { type: "image/png" }),
      purchaseOrder: new File([], "empty.pdf"),
      lineItemIds: "{nope",
    });
    const sections = summariseOnboarding(fd, { packages, intakeStages: [] });
    const files = sections.find((s) => s.stage === "files")!;
    expect(files.rows.map((r) => r.value)).toEqual(["logo.png", "Not attached", "Not attached"]);
    expect(sections.find((s) => s.stage === "package")!.rows.find((r) => r.label === "Line items")?.value).toBe("0");
  });
});
