import { describe, expect, it } from "vitest";
import {
  INTAKE_STAGES,
  applicableIntakeStages,
  describeAnswer,
  intakeFieldName,
  intakeProblem,
  parseIntakeAnswers,
} from "@/features/onboarding/intakeStages";

const form = (entries: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
};

describe("the intake specification", () => {
  it("has a stage for every partner-facing work group", () => {
    expect(INTAKE_STAGES.map((s) => s.slug).sort()).toEqual(
      ["capital", "customer-care", "finance", "human-resources", "logistics", "marketing", "tender-services"],
    );
  });

  it("uses unique keys within a stage, and every select has options", () => {
    for (const stage of INTAKE_STAGES) {
      const keys = stage.fields.map((f) => f.key);
      expect(new Set(keys).size, stage.slug).toBe(keys.length);
      for (const field of stage.fields) {
        if (field.type === "select") expect(field.options?.length, `${stage.slug}.${field.key}`).toBeGreaterThan(1);
        else expect(field.options, `${stage.slug}.${field.key}`).toBeUndefined();
      }
    }
  });

  it("asks each group for at least one required answer and a free-text note", () => {
    for (const stage of INTAKE_STAGES) {
      expect(stage.fields.some((f) => f.required), stage.slug).toBe(true);
      expect(stage.fields.at(-1)?.type, stage.slug).toBe("textarea");
    }
  });
});

describe("parseIntakeAnswers", () => {
  it("reads answers by stage, trimming and dropping blanks", () => {
    const fd = form({
      [intakeFieldName("finance", "accounting_system")]: "xero",
      [intakeFieldName("finance", "bank")]: "  FNB ",
      [intakeFieldName("finance", "notes")]: "   ",
      [intakeFieldName("logistics", "premises")]: "own-warehouse",
      registeredName: "Ridge Foods",
    });
    expect(parseIntakeAnswers(fd)).toEqual({
      finance: { accounting_system: "xero", bank: "FNB" },
      logistics: { premises: "own-warehouse" },
    });
  });

  it("ignores unknown stages and keys a stage does not define", () => {
    const fd = form({
      "intake[payroll][headcount]": "6-20",
      [intakeFieldName("finance", "made_up")]: "x",
      "intake[finance][accounting_system]extra": "x",
    });
    expect(parseIntakeAnswers(fd)).toEqual({});
  });

  it("omits a stage with nothing in it, so an untouched group gets no row", () => {
    expect(parseIntakeAnswers(form({ [intakeFieldName("capital", "notes")]: "" }))).toEqual({});
  });
});

describe("intakeProblem", () => {
  it("passes a complete set for the applicable stages", () => {
    const answers = { finance: { accounting_system: "sage", financial_year_end: "february" } };
    expect(intakeProblem(answers, ["finance"])).toBeNull();
  });

  it("names the first missing required answer", () => {
    expect(intakeProblem({ finance: { financial_year_end: "june" } }, ["finance"])).toBe(
      "Accounting system in use is required.",
    );
  });

  it("refuses a select answer that is not one of its options", () => {
    const answers = { finance: { accounting_system: "abacus", financial_year_end: "june" } };
    expect(intakeProblem(answers, ["finance"])).toBe("Accounting system in use: choose one of the listed options.");
  });

  it("refuses a number that is not a whole number", () => {
    const answers = { logistics: { premises: "none", locations: "2.5" } };
    expect(intakeProblem(answers, ["logistics"])).toBe("Number of locations served must be a whole number.");
  });

  it("only checks the stages that apply", () => {
    expect(intakeProblem({}, ["marketing"])).toBe("Logo files and brand guidelines available is required.");
    expect(intakeProblem({}, [])).toBeNull();
    expect(intakeProblem({ finance: {} }, ["logistics"])).toBe("Storage premises is required.");
  });
});

describe("applicableIntakeStages", () => {
  const lineItems = [
    { id: "li-1", workGroupSlug: "finance" },
    { id: "li-2", workGroupSlug: "finance" },
    { id: "li-3", workGroupSlug: "tender-services" },
    { id: "li-4", workGroupSlug: "sales-operations" },
    { id: "li-5", workGroupSlug: null },
  ];

  it("returns the stages for the groups the chosen items draw on, in stage order", () => {
    expect(applicableIntakeStages(["li-3", "li-1", "li-2"], lineItems).map((s) => s.slug)).toEqual([
      "finance",
      "tender-services",
    ]);
  });

  it("skips groups with no stage and items with no group", () => {
    expect(applicableIntakeStages(["li-4", "li-5"], lineItems)).toEqual([]);
  });
});

describe("describeAnswer", () => {
  const field = INTAKE_STAGES[0].fields[0];
  it("shows a select's label and a blank as a dash", () => {
    expect(describeAnswer(field, "greatsoft")).toBe("GreatSoft");
    expect(describeAnswer(field, undefined)).toBe("—");
    expect(describeAnswer({ key: "k", label: "L", type: "text" }, "FNB")).toBe("FNB");
  });
});
