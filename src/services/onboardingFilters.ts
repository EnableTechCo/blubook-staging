import type { Enums } from "@/types/database";

/**
 * The onboarding queue's vocabulary: its stages, how a request's query string
 * is read into them, and the counts the page summarises.
 *
 * STAGES lived in the page and was the only source of which values were valid,
 * so the page validated the query string against its own rendering list. The
 * parse and the summary reducers were inline in an async server component,
 * which is the one place they could not be tested. All of it is pure, so it
 * lives here beside the stage filter it belongs with.
 */

export type OnboardingQueueStage =
  | "all"
  | "awaiting_documents"
  | "awaiting_review"
  | "rejected"
  | "complete";

/** The filter chips, in display order. Also the definition of a valid stage. */
export const STAGES: { value: OnboardingQueueStage; label: string }[] = [
  { value: "all", label: "All" },
  { value: "awaiting_documents", label: "Awaiting documents" },
  { value: "awaiting_review", label: "Awaiting review" },
  { value: "rejected", label: "Rejected" },
  { value: "complete", label: "Complete" },
];

/** A `stage` query value, or "all" for anything that is not a known stage. */
export function parseQueueStage(raw: string | undefined): OnboardingQueueStage {
  return STAGES.some((option) => option.value === raw) ? (raw as OnboardingQueueStage) : "all";
}

/** A `q` query value: trimmed, capped at the length the search accepts. */
export function parseQueueQuery(raw: string | undefined): string {
  return raw?.trim().slice(0, 100) ?? "";
}

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

interface QueueSummary {
  cases: number;
  /** Documents the client still has to submit. */
  outstanding: number;
  /** Documents submitted and waiting for a staff decision. */
  awaitingReview: number;
  checklistItems: number;
}

/** The four figures on the queue's metric band, from one pass over the cases. */
export function summariseQueue(
  onboardings: { onboarding_documents: { status: Enums<"compliance_status"> }[] }[],
): QueueSummary {
  const summary: QueueSummary = { cases: onboardings.length, outstanding: 0, awaitingReview: 0, checklistItems: 0 };
  for (const onboarding of onboardings) {
    for (const document of onboarding.onboarding_documents) {
      summary.checklistItems += 1;
      if (document.status === "outstanding") summary.outstanding += 1;
      else if (document.status === "received") summary.awaitingReview += 1;
    }
  }
  return summary;
}
