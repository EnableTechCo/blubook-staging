import { describe, expect, it } from "vitest";
import { onboardingMatchesStage } from "@/services/onboardingFilters";
import type { Enums } from "@/types/database";

function onboarding(
  status: Enums<"onboarding_status">,
  documentStatuses: Enums<"compliance_status">[],
) {
  return {
    status,
    onboarding_documents: documentStatuses.map((documentStatus) => ({ status: documentStatus })),
  };
}

describe("onboarding queue filters", () => {
  const mixed = onboarding("awaiting_documents", ["outstanding", "received", "verified"]);

  it("keeps a partially submitted onboarding in the broad awaiting-documents view", () => {
    expect(onboardingMatchesStage(mixed, "awaiting_documents")).toBe(true);
  });

  it("includes the same onboarding in every matching document view", () => {
    expect(onboardingMatchesStage(mixed, "outstanding")).toBe(true);
    expect(onboardingMatchesStage(mixed, "awaiting_review")).toBe(true);
    expect(onboardingMatchesStage(mixed, "rejected")).toBe(false);
  });

  it("uses the stored onboarding state for completion", () => {
    expect(onboardingMatchesStage(onboarding("completed", ["verified", "verified"]), "complete")).toBe(
      true,
    );
    expect(onboardingMatchesStage(mixed, "complete")).toBe(false);
  });

  it("includes rejected replacements without hiding other outstanding work", () => {
    const replacement = onboarding("awaiting_documents", ["rejected", "outstanding"]);
    expect(onboardingMatchesStage(replacement, "rejected")).toBe(true);
    expect(onboardingMatchesStage(replacement, "outstanding")).toBe(true);
  });
});
