import { describe, expect, it } from "vitest";
import {
  STAGES,
  parseQueueQuery,
  parseQueueStage,
  summariseQueue,
} from "@/services/onboardingFilters";
import type { Enums } from "@/types/database";

// onboardingMatchesStage is covered in onboarding.test.ts beside the queue that
// applies it. These hold the pieces that were inline in the page until now.

describe("STAGES", () => {
  it("leads with the unfiltered view and never repeats a value", () => {
    expect(STAGES[0].value).toBe("all");
    expect(new Set(STAGES.map((s) => s.value)).size).toBe(STAGES.length);
  });
});

describe("parseQueueStage", () => {
  it.each(STAGES.map((s) => s.value))("accepts %s", (value) => {
    expect(parseQueueStage(value)).toBe(value);
  });

  it.each([undefined, "", "everything", "AWAITING_REVIEW", "complete "])(
    "falls back to all for %j rather than trusting the query string",
    (raw) => {
      expect(parseQueueStage(raw)).toBe("all");
    },
  );
});

describe("parseQueueQuery", () => {
  it("trims and passes a normal search through", () => {
    expect(parseQueueQuery("  Riverside  ")).toBe("Riverside");
  });

  it("caps the length at what the search accepts", () => {
    expect(parseQueueQuery("x".repeat(250))).toHaveLength(100);
  });

  it("reads an absent or blank query as empty", () => {
    expect(parseQueueQuery(undefined)).toBe("");
    expect(parseQueueQuery("   ")).toBe("");
  });
});

describe("summariseQueue", () => {
  const docs = (...statuses: Enums<"compliance_status">[]) => ({
    onboarding_documents: statuses.map((status) => ({ status })),
  });

  it("counts outstanding and received separately, and every item toward the total", () => {
    const summary = summariseQueue([
      docs("outstanding", "received", "verified"),
      docs("outstanding", "rejected"),
      docs("received"),
    ]);
    expect(summary).toEqual({ cases: 3, outstanding: 2, awaitingReview: 2, checklistItems: 6 });
  });

  it("counts a case with no checklist as a case, contributing nothing else", () => {
    expect(summariseQueue([docs(), docs("outstanding")])).toEqual({
      cases: 2, outstanding: 1, awaitingReview: 0, checklistItems: 1,
    });
  });

  it("is all zeros for an empty queue", () => {
    expect(summariseQueue([])).toEqual({ cases: 0, outstanding: 0, awaitingReview: 0, checklistItems: 0 });
  });

  it("does not count verified or rejected documents as awaiting anything", () => {
    const summary = summariseQueue([docs("verified", "rejected", "verified")]);
    expect(summary.outstanding).toBe(0);
    expect(summary.awaitingReview).toBe(0);
    expect(summary.checklistItems).toBe(3);
  });
});
