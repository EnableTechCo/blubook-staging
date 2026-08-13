import type { Enums } from "@/types/database";

export type OnboardingQueueStage =
  | "all"
  | "awaiting_documents"
  | "awaiting_review"
  | "outstanding"
  | "rejected"
  | "complete";

interface FilterableOnboarding {
  status: Enums<"onboarding_status">;
  onboarding_documents: { status: Enums<"compliance_status"> }[];
}

export function onboardingMatchesStage(
  onboarding: FilterableOnboarding,
  stage: OnboardingQueueStage,
): boolean {
  if (stage === "all") return true;
  if (stage === "awaiting_documents") return onboarding.status === "awaiting_documents";
  if (stage === "complete") return onboarding.status === "completed";

  const documentStatus = stage === "awaiting_review" ? "received" : stage;
  return onboarding.onboarding_documents.some((document) => document.status === documentStatus);
}
